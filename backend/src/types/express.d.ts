// Augment Express's Request so authenticated routes can read `req.userId`.
import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
