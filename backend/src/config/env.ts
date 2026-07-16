import "dotenv/config";

/**
 * Validate and expose environment variables in one typed place, so the rest of
 * the app never reads `process.env` directly (and fails fast on missing config).
 */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const isProd = (process.env.NODE_ENV ?? "development") === "production";

// The dev fallback is a publicly-known string — running production with it would
// let anyone forge a token for any user. Fail the boot instead.
function requiredSecret(key: string, devFallback: string): string {
  const value = process.env[key];
  if (isProd && (!value || value === devFallback)) {
    throw new Error(`${key} must be set to a strong unique value in production`);
  }
  return value ?? devFallback;
}

export const env = {
  port: Number(process.env.PORT ?? 5001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: requiredSecret("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  email: {
    user: process.env.EMAIL_USER ?? "",
    appPassword: process.env.EMAIL_APP_PASSWORD ?? "",
    from: process.env.EMAIL_FROM ?? "Ledger <no-reply@ledger.app>",
  },
  get isProd() {
    return this.nodeEnv === "production";
  },
};
