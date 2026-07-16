import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { notFound, errorHandler, ApiError } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import insightRoutes from "./routes/insights.routes";

const app = express();
app.disable("x-powered-by");

// --- Global middleware ---
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "50kb" }));

// Body-parser failures are client errors, not server crashes: malformed JSON
// (SyntaxError), oversize payloads (413), bad content encoding — all carry a 4xx
// `status`. Without this they'd surface as 500s (with a stack in dev).
app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const status =
    err && typeof err === "object" && "status" in err ? Number(err.status) : undefined;
  if (status && status >= 400 && status < 500) {
    const message =
      err instanceof SyntaxError ? "Invalid JSON in request body" : "Invalid request body";
    next(new ApiError(status, message));
    return;
  }
  next(err);
});

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ledger-backend", time: new Date().toISOString() });
});

// --- Feature routes ---
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/insights", insightRoutes);

// --- Frontend (production serving) ---
// If the built frontend exists, serve it from this same origin: `/api/*` is the API,
// everything else falls back to index.html for the SPA router. One origin means the
// axios baseURL "/api" works with no Vite proxy and no CORS in production.
const frontendDist =
  process.env.FRONTEND_DIST ?? path.resolve(process.cwd(), "../frontend/dist");
if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api(\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log(`📦 Serving frontend from ${frontendDist}`);
}

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
