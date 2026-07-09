import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";
import { geocodeAddress, haversineMiles } from "../services/geocode.js";

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
  const { customerId, originAddress, destinationAddress, weightLbs, pickupDate } = req.body;
  if (!customerId || !originAddress || !destinationAddress) {
    return res.status(400).json({ error: "customerId, originAddress, and destinationAddress are required" });
  }

  const proNumber = `PRO-${Math.floor(10000 + Math.random() * 89999)}`;
  const trackingToken = crypto.randomUUID();

  // Geocoding is optional — if no Google Maps key is set yet, these just come back null
  // and the shipment is still created; the map page will simply skip un-geocoded rows.
  const [origin, destination] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destinationAddress)
  ]);

  try {
    const { rows } = await pool.query(
      `INSERT INTO shipments
        (pro_number, customer_id, status, origin_address, destination_address, weight_lbs, pickup_date,
         origin_lat, origin_lng, destination_lat, destination_lng, driver_tracking_token)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        proNumber,
        customerId,
        originAddress,
        destinationAddress,
        weightLbs || null,
        pickupDate || null,
        origin?.lat || null,
        origin?.lng || null,
        destination?.lat || null,
        destination?.lng || null,
        trackingToken
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create shipment error:", err.message);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// Assign a shipment to a driver — used by the dispatch board's drag-and-drop.
router.patch("/:id/assign", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ error: "driverId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Row-lock the driver so two dispatchers can't double-book the same truck at once.
    const driverResult = await client.query(
      "SELECT * FROM drivers WHERE id = $1 FOR UPDATE",
      [driverId]
    );
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
    await client.query(
      "UPDATE drivers SET status = 'on_route' WHERE id = $1",
      [driverId]
    );

    await client.query("COMMIT");
    res.json(shipmentResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign shipment error:", err.message);
    res.status(500).json({ error: "Failed to assign shipment" });
  } finally {
    client.release();
  }
});

// Manually push a location update for a shipment — this is what the future driver-facing
// mobile page will call automatically via GPS. Useful now for demos and testing.
router.patch("/:id/location", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { lat, lng, speedMph } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE shipments
       SET current_lat = $1, current_lng = $2, current_speed_mph = $3, last_location_update = now()
       WHERE id = $4
       RETURNING *`,
      [lat, lng, speedMph || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Shipment not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Location update error:", err.message);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Mark a shipment delivered and auto-generate its invoice — the billing trigger from the plan.
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

    // Rate formula from the plan: base rate + (distance x fuel surcharge) + accessorial fees.
    // Falls back to a flat estimated distance when addresses haven't been geocoded yet.
    const BASE_RATE = 150;
    const FUEL_SURCHARGE_PER_MILE = 0.6;
    const ACCESSORIAL_FEES = 25;
    const FALLBACK_MILES = 300;
    const miles =
      shipment.origin_lat && shipment.destination_lat
        ? haversineMiles(
            { lat: Number(shipment.origin_lat), lng: Number(shipment.origin_lng) },
            { lat: Number(shipment.destination_lat), lng: Number(shipment.destination_lng) }
          )
        : FALLBACK_MILES;
    const amount = BASE_RATE + miles * FUEL_SURCHARGE_PER_MILE + ACCESSORIAL_FEES;

    const invoiceResult = await client.query(
      `INSERT INTO invoices (shipment_id, customer_id, amount, status)
       VALUES ($1, $2, $3, 'unpaid') RETURNING *`,
      [shipment.id, shipment.customer_id, amount]
    );

    await client.query("COMMIT");
    res.json({ shipment, invoice: invoiceResult.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Deliver shipment error:", err.message);
    res.status(500).json({ error: "Failed to mark shipment delivered" });
  } finally {
    client.release();
  }
});

export default router;

