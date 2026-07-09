import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

// Phase 2: dispatchers and super_admins can view/manage all shipments.
router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM shipments ORDER BY created_at DESC LIMIT 100"
  );
  res.json(rows);
});

export default router;
