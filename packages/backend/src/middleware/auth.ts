import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.ts";

/**
 * Simple token-match auth for only-me endpoints
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  // Authorization: Bearer <token>
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const provided = Buffer.from(token);
  const expected = Buffer.from(config.ADMIN_TOKEN);

  if (provided.length !== expected.length) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (timingSafeEqual(provided, expected)) {
    next();
    return;
  }

  res.status(401).json({ message: "Unauthorized" });
}
