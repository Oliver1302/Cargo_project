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

// Assign a shipment to a driver — used by the dispatch board's drag-and-drop.
router.patch("/:id/assign", requireAdminRole("super_admin", "dispatcher"), async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ error: "driverId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Row-lock the driver so two dispatchers can't double-book the same truck at once.
    const driverResult = await client.query(
      "SELECT * FROM drivers WHERE id = $1 FOR UPDATE",
      [driverId]
    );
    const driver = driverResult.rows[0];
    if (!driver) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Driver not found" });
    }
    if (driver.status !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Driver is not available" });
    }

    const shipmentResult = await client.query(
      "UPDATE shipments SET driver_id = $1, status = 'assigned' WHERE id = $2 RETURNING *",
      [driverId, id]
    );
    await client.query(
      "UPDATE drivers SET status = 'on_route' WHERE id = $1",
      [driverId]
    );

    await client.query("COMMIT");
    res.json(shipmentResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign shipment error:", err.message);
    res.status(500).json({ error: "Failed to assign shipment" });
  } finally {
    client.release();
  }
});

export default router;

