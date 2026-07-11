import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, s.pro_number
     FROM edi_log e
     LEFT JOIN shipments s ON s.id = e.shipment_id
     ORDER BY e.created_at DESC
     LIMIT 200`
  );
  res.json(rows);
});

export default router;
