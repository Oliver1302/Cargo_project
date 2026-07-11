import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM driver_applications ORDER BY created_at DESC"
  );
  res.json(rows);
});

// Approving creates the real drivers row — this is the actual vetting gate.
router.patch("/:id/approve", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const appResult = await client.query(
      "UPDATE driver_applications SET status = 'approved' WHERE id = $1 AND status = 'pending' RETURNING *",
      [req.params.id]
    );
    const application = appResult.rows[0];
    if (!application) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Application not found or already processed" });
    }

    const driverResult = await client.query(
      "INSERT INTO drivers (name, phone, status) VALUES ($1, $2, 'available') RETURNING *",
      [application.name, application.phone]
    );

    await client.query("COMMIT");
    res.json({ application, driver: driverResult.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Approve driver application error:", err.message);
    res.status(500).json({ error: "Failed to approve application" });
  } finally {
    client.release();
  }
});

router.patch("/:id/reject", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE driver_applications SET status = 'rejected' WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Application not found" });
  res.json(rows[0]);
});

export default router;
