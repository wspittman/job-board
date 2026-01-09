import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";
import { AppError } from "../utils/AppError.ts";

/**
 * Simple token-match auth for only-me endpoints
 */
export function adminOnly(req: Request, _res: Response, next: NextFunction) {
  // Authorization: Bearer <token>
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    next(new AppError("Unauthorized", 401));
    return;
  }

  const provided = Buffer.from(token);
  const expected = Buffer.from(config.ADMIN_TOKEN);

  if (provided.length !== expected.length) {
    next(new AppError("Unauthorized", 401));
    return;
  }

  if (timingSafeEqual(provided, expected)) {
    next();
    return;
  }

  next(new AppError("Unauthorized", 401));
}
