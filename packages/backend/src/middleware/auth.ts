import { NextFunction, Request, Response } from "express";
import { config } from "../config";

/**
 * Simple token-match auth for only-me endpoints
 */
export function validateAdmin(req: Request, res: Response, next: NextFunction) {
  // Authorization: Bearer <token>
  const token = req.header("Authorization")?.split(" ")[1];

  if (token === config.ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}
