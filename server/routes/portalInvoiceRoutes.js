import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireClient } from "../middleware/auth.js";

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
    "UPDATE invoices SET status = 'paid' WHERE id = $1 AND customer_id = $2 RETURNING *",
    [req.params.id, req.user.customerId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
  res.json(rows[0]);
});

export default router;
