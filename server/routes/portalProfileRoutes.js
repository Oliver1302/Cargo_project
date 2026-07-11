import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireClient } from "../middleware/auth.js";

const router = Router();

router.get("/", requireClient, async (req, res) => {
  const [customerResult, userResult] = await Promise.all([
    pool.query("SELECT * FROM customers WHERE id = $1", [req.user.customerId]),
    pool.query("SELECT email FROM users WHERE customer_id = $1 AND scope = 'client' LIMIT 1", [req.user.customerId])
  ]);
  if (customerResult.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
  res.json({ ...customerResult.rows[0], email: userResult.rows[0]?.email || null });
});

router.patch("/", requireClient, async (req, res) => {
  const { companyName, taxId, billingAddress } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET
       company_name = COALESCE($1, company_name),
       tax_id = COALESCE($2, tax_id),
       billing_address = COALESCE($3, billing_address)
     WHERE id = $4 RETURNING *`,
    [companyName || null, taxId || null, billingAddress || null, req.user.customerId]
  );
  res.json(rows[0]);
});

// --- Saved addresses ---

router.get("/addresses", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM client_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC",
    [req.user.customerId]
  );
  res.json(rows);
});

router.post("/addresses", requireClient, async (req, res) => {
  const { label, address, isDefault } = req.body;
  if (!label || !address) return res.status(400).json({ error: "label and address are required" });

  if (isDefault) {
    await pool.query("UPDATE client_addresses SET is_default = false WHERE customer_id = $1", [req.user.customerId]);
  }
  const { rows } = await pool.query(
    "INSERT INTO client_addresses (customer_id, label, address, is_default) VALUES ($1, $2, $3, $4) RETURNING *",
    [req.user.customerId, label, address, Boolean(isDefault)]
  );
  res.status(201).json(rows[0]);
});

router.delete("/addresses/:id", requireClient, async (req, res) => {
  await pool.query("DELETE FROM client_addresses WHERE id = $1 AND customer_id = $2", [req.params.id, req.user.customerId]);
  res.json({ ok: true });
});

// --- Payment methods (labels only — see migration note on why no real card data lives here) ---

router.get("/payment-methods", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM client_payment_methods WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC",
    [req.user.customerId]
  );
  res.json(rows);
});

router.post("/payment-methods", requireClient, async (req, res) => {
  const { methodType, displayLabel, isDefault } = req.body;
  if (!methodType || !displayLabel) return res.status(400).json({ error: "methodType and displayLabel are required" });

  if (isDefault) {
    await pool.query("UPDATE client_payment_methods SET is_default = false WHERE customer_id = $1", [req.user.customerId]);
  }
  const { rows } = await pool.query(
    "INSERT INTO client_payment_methods (customer_id, method_type, display_label, is_default) VALUES ($1, $2, $3, $4) RETURNING *",
    [req.user.customerId, methodType, displayLabel, Boolean(isDefault)]
  );
  res.status(201).json(rows[0]);
});

router.delete("/payment-methods/:id", requireClient, async (req, res) => {
  await pool.query("DELETE FROM client_payment_methods WHERE id = $1 AND customer_id = $2", [req.params.id, req.user.customerId]);
  res.json({ ok: true });
});

export default router;
