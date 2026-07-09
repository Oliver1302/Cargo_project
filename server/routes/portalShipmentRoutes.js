import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireClient } from "../middleware/auth.js";

const router = Router();

// Phase 3: a client can only ever see shipments tied to their own customer_id.
router.get("/", requireClient, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM shipments WHERE customer_id = $1 ORDER BY created_at DESC",
    [req.user.customerId]
  );
  res.json(rows);
});

export default router;
