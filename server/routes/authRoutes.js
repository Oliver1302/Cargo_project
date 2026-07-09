import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";

const router = Router();

// Public — new B2B clients create their own account. Creates the customer record and
// the user record in one transaction, then logs them straight in.
router.post("/register-client", async (req, res) => {
  const { companyName, taxId, billingAddress, email, password } = req.body;
  if (!companyName || !email || !password) {
    return res.status(400).json({ error: "companyName, email, and password are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    const customerResult = await client.query(
      "INSERT INTO customers (company_name, tax_id, billing_address) VALUES ($1, $2, $3) RETURNING id",
      [companyName, taxId || null, billingAddress || null]
    );
    const customerId = customerResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(
      "INSERT INTO users (email, password_hash, scope, role, customer_id) VALUES ($1, $2, 'client', 'client_user', $3)",
      [email, passwordHash, customerId]
    );

    await client.query("COMMIT");

    const token = jwt.sign(
      { sub: email, scope: "client", role: "client_user", customerId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
    res.status(201).json({ token, scope: "client", role: "client_user" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register client error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        sub: user.id,
        scope: user.scope,
        role: user.role,
        customerId: user.customer_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({ token, scope: user.scope, role: user.role });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
