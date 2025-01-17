import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { AppError } from "../utils/AppError";

/**
 * Simple token-match auth for only-me endpoints
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  // Authorization: Bearer <token>
  const token = req.header("Authorization")?.split(" ")[1];

  if (token === config.ADMIN_TOKEN) {
    next();
  } else {
    next(new AppError("Unauthorized", 401));
  }
}
