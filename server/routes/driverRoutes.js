import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// Fetch shipment info for the driver's page — no login, just the unguessable token in the URL.
router.get("/:token", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT pro_number, status, origin_address, destination_address FROM shipments WHERE driver_tracking_token = $1",
    [req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invalid tracking link" });
  res.json(rows[0]);
});

// Driver's phone pushes a location update while en route.
router.post("/:token/location", async (req, res) => {
  const { lat, lng, speedMph } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng required" });

  const { rows } = await pool.query(
    `UPDATE shipments
     SET current_lat = $1, current_lng = $2, current_speed_mph = $3, last_location_update = now(),
         status = CASE WHEN status = 'assigned' THEN 'in_transit' ELSE status END
     WHERE driver_tracking_token = $4
     RETURNING id`,
    [lat, lng, speedMph || null, req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invalid tracking link" });
  res.json({ ok: true });
});

// Driver taps "Mark as delivered" — flips status, frees up the driver, generates the invoice.
router.post("/:token/deliver", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const shipmentResult = await client.query(
      "UPDATE shipments SET status = 'delivered' WHERE driver_tracking_token = $1 RETURNING *",
      [req.params.token]
    );
    const shipment = shipmentResult.rows[0];
    if (!shipment) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invalid tracking link" });
    }
    if (shipment.driver_id) {
      await client.query("UPDATE drivers SET status = 'available' WHERE id = $1", [shipment.driver_id]);
    }
    await client.query(
      `INSERT INTO invoices (shipment_id, customer_id, amount, status)
       VALUES ($1, $2, $3, 'unpaid')`,
      [shipment.id, shipment.customer_id, 150 + 300 * 0.6 + 25]
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Driver deliver error:", err.message);
    res.status(500).json({ error: "Failed to mark delivered" });
  } finally {
    client.release();
  }
});

export default router;
