import { rateLimit } from "express-rate-limit";

// Brute-force guard for credential endpoints (login/register/change-password).
// NOT applied to /auth/me — the app calls that on every boot.
export const credentialLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});
