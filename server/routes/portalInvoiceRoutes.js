import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireClient } from "../middleware/auth.js";
import { initiateMpesaPush } from "../services/notify.js";

const router = Router();

router.get("/", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, s.pro_number
     FROM invoices i
     JOIN shipments s ON s.id = i.shipment_id
     WHERE i.customer_id = $1
     ORDER BY i.created_at DESC`,
    [req.user.customerId]
  );
  res.json(rows);
});

// No real payment gateway wired up yet — this simulates a successful payment so the
// UI flow works end to end. Swap for a real Stripe PaymentIntent once you have API keys.
router.post("/:id/pay", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE invoices SET status = 'paid', payment_method = 'card' WHERE id = $1 AND customer_id = $2 RETURNING *",
    [req.params.id, req.user.customerId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
  res.json(rows[0]);
});

// M-Pesa STK Push — currently a placeholder. Requires a Safaricom paybill/till number and
// Daraja API credentials before it can actually reach a phone; until then, this returns a
// clear "not connected yet" message instead of pretending to succeed.
router.post("/:id/pay-mpesa", requireClient, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone is required" });

  const { rows } = await pool.query(
    "SELECT * FROM invoices WHERE id = $1 AND customer_id = $2",
    [req.params.id, req.user.customerId]
  );
  const invoice = rows[0];
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const result = await initiateMpesaPush(phone, invoice.amount);
  res.json({
    initiated: result.initiated,
    message: result.initiated
      ? "STK push sent — check your phone to complete payment."
      : "M-Pesa isn't connected yet. This button is ready to go live the moment a paybill/till number and Daraja credentials are added."
  });
});

export default router;
