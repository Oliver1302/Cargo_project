import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, s.pro_number, c.company_name
     FROM invoices i
     JOIN shipments s ON s.id = i.shipment_id
     JOIN customers c ON c.id = i.customer_id
     ORDER BY i.created_at DESC`
  );
  res.json(rows);
});

// Update the rate engine breakdown for one invoice — recomputes Gross and Net every time.
router.patch("/:id", requireAdminRole("super_admin", "accountant"), async (req, res) => {
  const {
    linehaulRate = 0, fscRate = 0, detentionHours = 0, detentionRate = 60,
    lumperFee = 0, tarpingFee = 0, driverPay = 0, factoringFee = 0
  } = req.body;

  const detentionTotal = Number(detentionHours) * Number(detentionRate);
  const gross =
    Number(linehaulRate) + Number(fscRate) + detentionTotal + Number(lumperFee) + Number(tarpingFee);
  const netRate = gross - Number(driverPay) - Number(factoringFee);

  const { rows } = await pool.query(
    `UPDATE invoices SET
       linehaul_rate = $1, fsc_rate = $2, detention_hours = $3, detention_rate = $4,
       lumper_fee = $5, tarping_fee = $6, driver_pay = $7, factoring_fee = $8,
       amount = $9, net_rate = $10
     WHERE id = $11 RETURNING *`,
    [linehaulRate, fscRate, detentionHours, detentionRate, lumperFee, tarpingFee,
     driverPay, factoringFee, gross, netRate, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
  res.json(rows[0]);
});

export default router;
