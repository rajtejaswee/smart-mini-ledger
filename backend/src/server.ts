import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";

const server = app.listen(env.port, () => {
  console.log(`🟢 Ledger API running on http://localhost:${env.port}`);
});

// Graceful shutdown — close DB connections cleanly
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
