import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

/**
 * Errors controllers can throw; Express 5 forwards them here — including rejected
 * async handlers — so we get one consistent JSON error shape.
 */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 404 for unmatched routes
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler — must keep the 4-arg signature for Express to detect it.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";

  const payload: Record<string, unknown> = { error: message };
  if (isApiError && err.details) payload.details = err.details;

  if (!env.isProd && status === 500) {
    payload.stack = err instanceof Error ? err.stack : undefined;
    console.error(err);
  }

  res.status(status).json(payload);
}
