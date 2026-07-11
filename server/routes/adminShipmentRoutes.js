import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";
import { geocodeAddress, haversineMiles } from "../services/geocode.js";
import { sendWhatsApp, sendEmail, sendSMS, getClientEmail } from "../services/notify.js";
import { logEdi } from "../services/edi.js";
import { suggestDriver } from "../services/aiDispatch.js";

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "+254798409150";

// Rate engine defaults — used to auto-populate an invoice on delivery. Every field stays
// editable afterward on the admin Invoices screen (Linehaul, FSC, accessorials, driver pay,
// factoring fee), matching the Gross/Net formula:
//   Gross = Linehaul + FSC + Accessorials
//   Net   = Gross - Driver Pay - Factoring Fee
const LINEHAUL_PER_MILE = 2.0;
const FSC_PER_MILE = 0.45; // approximates EIA diesel-index-based fuel surcharge
const DRIVER_PAY_PER_MILE = 0.55; // typical owner-operator/company driver per-mile pay
const FACTORING_RATE = 0.03; // 3% factoring fee, common in freight brokerage
const FALLBACK_MILES = 300;
const FULL_CONTAINER_FLAT_LINEHAUL = 1800;

const router = Router();

// Phase 2: dispatchers and super_admins can view/manage all shipments.
router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM shipments ORDER BY created_at DESC LIMIT 100"
  );
  res.json(rows);
});

// Create a new shipment from the admin booking form.
router.post("/", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const {
    customerId, originAddress, destinationAddress, weightLbs, pickupDate,
    isFullContainer, requestedEquipmentType, borderCrossingPoint
  } = req.body;
  if (!customerId || !originAddress || !destinationAddress) {
    return res.status(400).json({ error: "customerId, originAddress, and destinationAddress are required" });
  }

  const proNumber = `PRO-${Math.floor(10000 + Math.random() * 89999)}`;
  const trackingToken = crypto.randomUUID();

  const [origin, destination] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destinationAddress)
  ]);

  try {
    const { rows } = await pool.query(
      `INSERT INTO shipments
        (pro_number, customer_id, status, origin_address, destination_address, weight_lbs, pickup_date,
         origin_lat, origin_lng, destination_lat, destination_lng, driver_tracking_token, is_full_container,
         requested_equipment_type, border_crossing_point, customs_status)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        proNumber, customerId, originAddress, destinationAddress, weightLbs || null, pickupDate || null,
        origin?.lat || null, origin?.lng || null, destination?.lat || null, destination?.lng || null,
        trackingToken, Boolean(isFullContainer), requestedEquipmentType || "V",
        borderCrossingPoint || null, borderCrossingPoint ? "pending" : "not_required"
      ]
    );
    res.status(201).json(rows[0]);
    logEdi(pool, rows[0].id, "204", `Load Tender: ${proNumber}, ${originAddress} -> ${destinationAddress}`);
  } catch (err) {
    console.error("Create shipment error:", err.message);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// Assign a shipment to a driver — used by the dispatch board's drag-and-drop.
// This is treated as the "driver accepted" moment (EDI 990 equivalent) since real two-way
// WhatsApp/EDI acceptance needs a webhook we haven't built yet.
router.patch("/:id/assign", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ error: "driverId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const driverResult = await client.query("SELECT * FROM drivers WHERE id = $1 FOR UPDATE", [driverId]);
    const driver = driverResult.rows[0];
    if (!driver) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Driver not found" });
    }
    if (driver.status !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Driver is not available" });
    }

    const shipmentResult = await client.query(
      "UPDATE shipments SET driver_id = $1, status = 'assigned' WHERE id = $2 RETURNING *",
      [driverId, id]
    );
    await client.query("UPDATE drivers SET status = 'on_route' WHERE id = $1", [driverId]);

    await client.query("COMMIT");
    const shipment = shipmentResult.rows[0];
    res.json(shipment);

    const clientEmail = await getClientEmail(pool, shipment.customer_id);
    const message =
      `Driver found for ${shipment.pro_number}\n` +
      `Driver: ${driver.name}${driver.phone ? ` (${driver.phone})` : ""}\n` +
      `Route: ${shipment.origin_address} -> ${shipment.destination_address}`;

    if (driver.phone) {
      sendWhatsApp(
        driver.phone,
        `You've been assigned shipment ${shipment.pro_number}: ${shipment.origin_address} -> ${shipment.destination_address}. Open your tracking link to start the route.`
      );
      sendSMS(driver.phone, `New load assigned: ${shipment.pro_number}. Check WhatsApp or your dispatcher for the tracking link.`);
    }
    sendWhatsApp(ADMIN_WHATSAPP_NUMBER, message);
    sendSMS(ADMIN_WHATSAPP_NUMBER, message);
    if (clientEmail) sendEmail(clientEmail, `Driver found for ${shipment.pro_number}`, message);
    logEdi(pool, shipment.id, "990", `Load Accepted by ${driver.name} for ${shipment.pro_number}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign shipment error:", err.message);
    res.status(500).json({ error: "Failed to assign shipment" });
  } finally {
    client.release();
  }
});

// Manually push a location update for a shipment — stand-in until the driver page's real
// GPS feed is the only source of truth.
router.patch("/:id/location", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { lat, lng, speedMph } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng are required" });

  try {
    const { rows } = await pool.query(
      `UPDATE shipments
       SET current_lat = $1, current_lng = $2, current_speed_mph = $3, last_location_update = now()
       WHERE id = $4 RETURNING *`,
      [lat, lng, speedMph || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Shipment not found" });
    res.json(rows[0]);
    logEdi(pool, req.params.id, "214", `Status update: position ${lat}, ${lng}${speedMph ? ` at ${speedMph} mph` : ""}`);
  } catch (err) {
    console.error("Location update error:", err.message);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Mark a shipment delivered and auto-generate its invoice using the full rate engine —
// every field below stays editable afterward on the Invoices screen.
router.patch("/:id/deliver", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const shipmentResult = await client.query(
      "UPDATE shipments SET status = 'delivered' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    const shipment = shipmentResult.rows[0];
    if (!shipment) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Shipment not found" });
    }
    if (shipment.driver_id) {
      await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [shipment.driver_id]);
    }

    const miles =
      shipment.origin_lat && shipment.destination_lat
        ? haversineMiles(
            { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) },
            { lat: Number(shipment.destination_lat), lng: Number(shipment.destination_lng) }
          )
        : FALLBACK_MILES;

    const linehaulRate = shipment.is_full_container ? FULL_CONTAINER_FLAT_LINEHAUL : miles * LINEHAUL_PER_MILE;
    const fscRate = shipment.is_full_container ? 0 : miles * FSC_PER_MILE;
    const driverPay = miles * DRIVER_PAY_PER_MILE;
    const grossBeforeFactoring = linehaulRate + fscRate; // accessorials start at 0, added later on the Invoices screen
    const factoringFee = grossBeforeFactoring * FACTORING_RATE;
    const netRate = grossBeforeFactoring - driverPay - factoringFee;

    const invoiceResult = await client.query(
      `INSERT INTO invoices
        (shipment_id, customer_id, amount, status, linehaul_rate, fsc_rate, driver_pay, factoring_fee, net_rate, miles)
       VALUES ($1, $2, $3, 'unpaid', $4, $5, $6, $7, $8, $9) RETURNING *`,
      [shipment.id, shipment.customer_id, grossBeforeFactoring, linehaulRate, fscRate, driverPay, factoringFee, netRate, miles]
    );

    await client.query("COMMIT");
    res.json({ shipment, invoice: invoiceResult.rows[0] });

    const clientEmail = await getClientEmail(pool, shipment.customer_id);
    const message = `Cargo ${shipment.pro_number} has been delivered to ${shipment.destination_address}.`;
    sendWhatsApp(ADMIN_WHATSAPP_NUMBER, message);
    sendSMS(ADMIN_WHATSAPP_NUMBER, message);
    if (clientEmail) sendEmail(clientEmail, `Delivered: ${shipment.pro_number}`, message);
    logEdi(pool, shipment.id, "214", `Final status update: delivered to ${shipment.destination_address}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Deliver shipment error:", err.message);
    res.status(500).json({ error: "Failed to mark shipment delivered" });
  } finally {
    client.release();
  }
});

// Store a Proof of Delivery photo (admin-side upload — the driver page has its own).
router.post("/:id/pod", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { photoBase64 } = req.body;
  if (!photoBase64) return res.status(400).json({ error: "photoBase64 is required" });
  const { rows } = await pool.query(
    "UPDATE shipments SET pod_photo_base64 = $1 WHERE id = $2 RETURNING id",
    [photoBase64, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Shipment not found" });
  res.json({ ok: true });
});

// AI-assisted (or rule-based fallback) suggestion for which available driver to assign.
router.get("/:id/suggest-driver", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const shipmentResult = await pool.query("SELECT * FROM shipments WHERE id = $1", [req.params.id]);
  const shipment = shipmentResult.rows[0];
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const driversResult = await pool.query("SELECT * FROM drivers WHERE status = 'available'");

  const AVG_SPEED_MPH = 55;
  const candidates = driversResult.rows.map((d) => {
    const hasCoords = shipment.origin_lat && shipment.destination_lat;
    const loadedMiles = hasCoords
      ? haversineMiles(
          { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) },
          { lat: Number(shipment.destination_lat), lng: Number(shipment.destination_lng) }
        )
      : FALLBACK_MILES;
    const deadheadMiles =
      hasCoords && d.current_lat
        ? haversineMiles(
            { lat: Number(d.current_lat), lng: Number(d.current_lng) },
            { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) }
          )
        : null;
    const totalMiles = loadedMiles + (deadheadMiles || 0);
    const margin = loadedMiles * LINEHAUL_PER_MILE - totalMiles * DRIVER_PAY_PER_MILE;
    const estimatedHours = totalMiles / AVG_SPEED_MPH;
    return {
      id: d.id,
      name: d.name,
      deadheadMiles,
      loadedMiles,
      hoursRemaining: d.hours_remaining,
      margin,
      atRisk: d.hours_remaining != null && estimatedHours > Number(d.hours_remaining)
    };
  });

  const suggestion = await suggestDriver(shipment, candidates);
  res.json({ suggestion, candidates });
});

// Update customs clearance status for cross-border shipments.
router.patch("/:id/customs-status", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { customsStatus } = req.body;
  const { rows } = await pool.query(
    "UPDATE shipments SET customs_status = $1 WHERE id = $2 RETURNING *",
    [customsStatus, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Shipment not found" });
  res.json(rows[0]);
});

export default router;
