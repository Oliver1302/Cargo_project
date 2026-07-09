import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import adminShipmentRoutes from "./routes/adminShipmentRoutes.js";
import adminDriverRoutes from "./routes/adminDriverRoutes.js";
import portalShipmentRoutes from "./routes/portalShipmentRoutes.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: [process.env.ADMIN_ORIGIN, process.env.PORTAL_ORIGIN] }
});

app.use(cors({ origin: [process.env.ADMIN_ORIGIN, process.env.PORTAL_ORIGIN] }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/shipments", requireAuth, adminShipmentRoutes);
app.use("/api/admin/drivers", requireAuth, adminDriverRoutes);
app.use("/api/portal/shipments", requireAuth, portalShipmentRoutes);

// Phase 4: driver location updates come in here and get broadcast to subscribed clients.
io.on("connection", (socket) => {
  socket.on("location-update", (payload) => {
    io.emit("location-update", payload);
  });
});

const port = process.env.PORT || 4000;
httpServer.listen(port, () => console.log(`API listening on http://localhost:${port}`));
