import { Router } from "express";
import { pool } from "../db/pool.js";
import { sendWhatsApp } from "../services/notify.js";

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "+254798409150";

const router = Router();

// Public — anyone can apply from the landing page. Does NOT create a real driver record;
// an admin must review and approve first (see adminDriverApplicationRoutes.js).
router.post("/", async (req, res) => {
  const { name, phone, licenseNumber, equipmentType, vehicleDetails } = req.body;
  if (!name || !phone || !licenseNumber) {
    return res.status(400).json({ error: "name, phone, and licenseNumber are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO driver_applications (name, phone, license_number, equipment_type, vehicle_details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, licenseNumber, equipmentType || "V", vehicleDetails || null]
    );
    res.status(201).json(rows[0]);
    sendWhatsApp(ADMIN_WHATSAPP_NUMBER, `New driver application: ${name} (${phone}), license ${licenseNumber}. Review in the admin dashboard.`);
  } catch (err) {
    console.error("Driver application error:", err.message);
    res.status(500).json({ error: "Failed to submit application" });
  }
});

export default router;
