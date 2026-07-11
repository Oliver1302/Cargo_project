import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import adminShipmentRoutes from "./routes/adminShipmentRoutes.js";
import adminDriverRoutes from "./routes/adminDriverRoutes.js";
import adminCustomerRoutes from "./routes/adminCustomerRoutes.js";
import portalShipmentRoutes from "./routes/portalShipmentRoutes.js";
import portalInvoiceRoutes from "./routes/portalInvoiceRoutes.js";
import adminInvoiceRoutes from "./routes/adminInvoiceRoutes.js";
import adminEdiRoutes from "./routes/adminEdiRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import driverApplicationRoutes from "./routes/driverApplicationRoutes.js";
import adminDriverApplicationRoutes from "./routes/adminDriverApplicationRoutes.js";
import portalProfileRoutes from "./routes/portalProfileRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const allowedOrigins = [process.env.ADMIN_ORIGIN, process.env.PORTAL_ORIGIN, process.env.LANDING_ORIGIN];

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/shipments", requireAuth, adminShipmentRoutes);
app.use("/api/admin/drivers", requireAuth, adminDriverRoutes);
app.use("/api/admin/customers", requireAuth, adminCustomerRoutes);
app.use("/api/portal/shipments", requireAuth, portalShipmentRoutes);
app.use("/api/portal/invoices", requireAuth, portalInvoiceRoutes);
app.use("/api/admin/invoices", requireAuth, adminInvoiceRoutes);
app.use("/api/admin/edi-log", requireAuth, adminEdiRoutes);
app.use("/api/driver", driverRoutes); // public — token-authenticated, not JWT
app.use("/api/driver-applications", driverApplicationRoutes); // public — landing page form
app.use("/api/admin/driver-applications", requireAuth, adminDriverApplicationRoutes);
app.use("/api/portal/profile", requireAuth, portalProfileRoutes);
app.use("/api/admin/analytics", requireAuth, adminAnalyticsRoutes);

// Phase 4: driver location updates come in here and get broadcast to subscribed clients.
io.on("connection", (socket) => {
  socket.on("location-update", (payload) => {
    io.emit("location-update", payload);
  });
});

const port = process.env.PORT || 4000;
httpServer.listen(port, () => console.log(`API listening on http://localhost:${port}`));
