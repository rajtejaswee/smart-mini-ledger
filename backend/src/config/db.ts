import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Single shared Prisma instance. In dev, tsx/nodemon reloads can otherwise spawn
// many clients and exhaust DB connections, so we cache it on globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ["error"] : ["warn", "error"],
  });

if (!env.isProd) {
  globalForPrisma.prisma = prisma;
}
