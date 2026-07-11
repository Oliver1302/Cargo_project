import { Router } from "express";
import { pool } from "../db/pool.js";
import { sendWhatsApp, sendEmail, sendSMS, getClientEmail } from "../services/notify.js";
import { logEdi } from "../services/edi.js";

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "+254798409150";

const router = Router();

router.get("/:token", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT pro_number, status, origin_address, destination_address FROM shipments WHERE driver_tracking_token = $1",
    [req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invalid tracking link" });
  res.json(rows[0]);
});

router.post("/:token/pickup", async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE shipments SET status = 'in_transit'
     WHERE driver_tracking_token = $1 AND status = 'assigned' RETURNING *`,
    [req.params.token]
  );
  if (rows.length === 0) return res.json({ ok: true, alreadyPickedUp: true });

  const shipment = rows[0];
  const clientEmail = await getClientEmail(pool, shipment.customer_id);
  const message = `Cargo ${shipment.pro_number} has been picked up from ${shipment.origin_address}.`;
  sendWhatsApp(ADMIN_WHATSAPP_NUMBER, message);
  sendSMS(ADMIN_WHATSAPP_NUMBER, message);
  if (clientEmail) sendEmail(clientEmail, `Picked up: ${shipment.pro_number}`, message);
  logEdi(pool, shipment.id, "214", `Status update: picked up from ${shipment.origin_address}`);

  res.json({ ok: true });
});

router.post("/:token/location", async (req, res) => {
  const { lat, lng, speedMph } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng required" });

  const { rows } = await pool.query(
    `UPDATE shipments
     SET current_lat = $1, current_lng = $2, current_speed_mph = $3, last_location_update = now()
     WHERE driver_tracking_token = $4 RETURNING id`,
    [lat, lng, speedMph || null, req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invalid tracking link" });
  res.json({ ok: true });
});

// Driver uploads the signed BOL / proof of delivery photo — required to fully close out
// the shipment's paper trail. Stored as base64 for now (fine at demo scale; swap for real
// object storage like S3/Supabase Storage once volume grows).
router.post("/:token/pod", async (req, res) => {
  const { photoBase64 } = req.body;
  if (!photoBase64) return res.status(400).json({ error: "photoBase64 is required" });
  const { rows } = await pool.query(
    "UPDATE shipments SET pod_photo_base64 = $1 WHERE driver_tracking_token = $2 RETURNING id",
    [photoBase64, req.params.token]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invalid tracking link" });
  res.json({ ok: true });
});

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

    const linehaul = 150;
    const fsc = 90;
    const driverPay = 165;
    const gross = linehaul + fsc;
    const factoringFee = gross * 0.03;
    const netRate = gross - driverPay - factoringFee;

    await client.query(
      `INSERT INTO invoices (shipment_id, customer_id, amount, status, linehaul_rate, fsc_rate, driver_pay, factoring_fee, net_rate)
       VALUES ($1, $2, $3, 'unpaid', $4, $5, $6, $7, $8)`,
      [shipment.id, shipment.customer_id, gross, linehaul, fsc, driverPay, factoringFee, netRate]
    );
    await client.query("COMMIT");
    res.json({ ok: true });

    const clientEmail = await getClientEmail(pool, shipment.customer_id);
    const message = `Cargo ${shipment.pro_number} has been delivered to ${shipment.destination_address}.`;
    sendWhatsApp(ADMIN_WHATSAPP_NUMBER, message);
    sendSMS(ADMIN_WHATSAPP_NUMBER, message);
    if (clientEmail) sendEmail(clientEmail, `Delivered: ${shipment.pro_number}`, message);
    logEdi(pool, shipment.id, "214", `Final status update: delivered to ${shipment.destination_address}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Driver deliver error:", err.message);
    res.status(500).json({ error: "Failed to mark delivered" });
  } finally {
    client.release();
  }
});

export default router;
