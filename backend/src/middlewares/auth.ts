import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler";
import { verifyToken } from "../utils/jwt";

/**
 * Gate for protected routes. Expects `Authorization: Bearer <token>`, verifies it,
 * and attaches `req.userId` for downstream handlers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}
