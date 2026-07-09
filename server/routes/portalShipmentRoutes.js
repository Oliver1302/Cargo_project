import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { requireClient } from "../middleware/auth.js";
import { geocodeAddress, haversineMiles } from "../services/geocode.js";

const RATE_PER_MILE = 2.5;
const FALLBACK_ESTIMATE = 450; // used only when no Maps key is configured yet

const router = Router();

// Phase 3: a client can only ever see shipments tied to their own customer_id.
router.get("/", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM shipments WHERE customer_id = $1 ORDER BY created_at DESC",
    [req.user.customerId]
  );
  res.json(rows);
});

// Instant quote estimate for the booking tool. Falls back to a flat estimate if no
// Google Maps API key is set yet — replace with a real quote once GOOGLE_MAPS_API_KEY exists.
router.post("/quote", requireClient, async (req, res) => {
  const { originAddress, destinationAddress } = req.body;
  if (!originAddress || !destinationAddress) {
    return res.status(400).json({ error: "originAddress and destinationAddress are required" });
  }

  const [origin, destination] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destinationAddress)
  ]);

  if (!origin || !destination) {
    return res.json({
      estimated: false,
      price: FALLBACK_ESTIMATE,
      note: "Estimate is a placeholder — add GOOGLE_MAPS_API_KEY on the server for a real distance-based quote."
    });
  }

  const miles = haversineMiles(origin, destination);
  const price = Math.round(miles * RATE_PER_MILE);
  res.json({ estimated: true, miles: Math.round(miles), price });
});

// Create a new shipment from the client's booking tool — always scoped to their own customer_id.
router.post("/", requireClient, async (req, res) => {
  const { originAddress, destinationAddress, weightLbs, pickupDate } = req.body;
  if (!originAddress || !destinationAddress) {
    return res.status(400).json({ error: "originAddress and destinationAddress are required" });
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
         origin_lat, origin_lng, destination_lat, destination_lng, driver_tracking_token)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        proNumber,
        req.user.customerId,
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
    console.error("Create portal shipment error:", err.message);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// Full detail for one shipment — includes driver + vehicle info and live position,
// used by the client-facing tracking page. Always scoped to the caller's own customer_id.
router.get("/:id", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
        s.*,
        d.name AS driver_name,
        v.plate AS vehicle_plate,
        v.type AS vehicle_type
     FROM shipments s
     LEFT JOIN drivers d ON d.id = s.driver_id
     LEFT JOIN vehicles v ON v.id = d.vehicle_id
     WHERE s.id = $1 AND s.customer_id = $2`,
    [req.params.id, req.user.customerId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Shipment not found" });

  const shipment = rows[0];
  let remainingMiles = null;
  if (shipment.current_lat && shipment.destination_lat) {
    remainingMiles = Math.round(
      haversineMiles(
        { lat: Number(shipment.current_lat), lng: Number(shipment.current_lng) },
        { lat: Number(shipment.destination_lat), lng: Number(shipment.destination_lng) }
      )
    );
  }

  res.json({ ...shipment, remaining_miles: remainingMiles });
});

export default router;
