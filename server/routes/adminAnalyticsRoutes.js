import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAdminRole } from "../middleware/auth.js";

const router = Router();

const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90, all: null };

router.get("/", requireAdminRole("super_admin", "dispatcher", "accountant"), async (req, res) => {
  const period = req.query.period || "30d";
  const days = PERIOD_DAYS[period] ?? 30;
  const sinceClause = days ? `WHERE i.created_at >= now() - interval '${days} days'` : "";

  const [revenueByDay, statusCounts, kpis, topRoutes] = await Promise.all([
    pool.query(
      `SELECT date_trunc('day', i.created_at) AS day,
              SUM(i.amount) AS gross, SUM(i.net_rate) AS net, COUNT(*) AS invoice_count
       FROM invoices i ${sinceClause}
       GROUP BY day ORDER BY day ASC`
    ),
    pool.query(
      `SELECT status, COUNT(*) AS count FROM shipments
       ${days ? `WHERE created_at >= now() - interval '${days} days'` : ""}
       GROUP BY status`
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_gross,
         COALESCE(SUM(net_rate), 0) AS total_net,
         COALESCE(AVG(amount), 0) AS avg_invoice,
         COUNT(*) AS invoice_count,
         COALESCE(SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END), 0) AS outstanding
       FROM invoices i ${sinceClause}`
    ),
    pool.query(
      `SELECT s.origin_address, s.destination_address, COUNT(*) AS shipment_count
       FROM shipments s
       ${days ? `WHERE s.created_at >= now() - interval '${days} days'` : ""}
       GROUP BY s.origin_address, s.destination_address
       ORDER BY shipment_count DESC LIMIT 5`
    )
  ]);

  res.json({
    revenueByDay: revenueByDay.rows,
    statusCounts: statusCounts.rows,
    kpis: kpis.rows[0],
    topRoutes: topRoutes.rows
  });
});

export default router;
