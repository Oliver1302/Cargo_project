import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM drivers ORDER BY name ASC");
  res.json(rows);
});

// Manual proxy for ELD hours + last known location — until a real ELD (Motive/Samsara)
// integration exists, dispatchers enter this by hand.
router.patch("/:id", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { hoursRemaining, currentLat, currentLng } = req.body;
  const { rows } = await pool.query(
    `UPDATE drivers SET
       hours_remaining = COALESCE($1, hours_remaining),
       current_lat = COALESCE($2, current_lat),
       current_lng = COALESCE($3, current_lng)
     WHERE id = $4 RETURNING *`,
    [hoursRemaining ?? null, currentLat ?? null, currentLng ?? null, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Driver not found" });
  res.json(rows[0]);
});

export default router;
