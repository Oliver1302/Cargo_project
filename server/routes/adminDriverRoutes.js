import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM drivers ORDER BY name ASC");
  res.json(rows);
});

export default router;
