import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "./errorHandler";

/**
 * Validate `req.body` against a zod schema. On success, replaces the body with
 * the parsed (and normalized) data. On failure, throws a 400 with field-level
 * details — Express forwards the throw to the central error handler.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(body)",
        message: issue.message,
      }));
      throw new ApiError(400, "Validation failed", details);
    }
    req.body = result.data;
    next();
  };
}
