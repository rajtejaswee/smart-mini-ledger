import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { notFound, errorHandler } from "./middlewares/errorHandler";

const app = express();

// --- Global middleware ---
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ledger-backend", time: new Date().toISOString() });
});

// --- Feature routes (mounted as we build them) ---
// app.use("/api/auth", authRoutes);
// app.use("/api/transactions", transactionRoutes);
// app.use("/api/insights", insightRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
