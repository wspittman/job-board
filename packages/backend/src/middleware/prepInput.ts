import { NextFunction, Request, Response } from "express";

/**
 * Middleware to prepare input for controllers.
 */
export function prepInput(req: Request, res: Response, next: NextFunction) {
  res.locals.input = req.method === "GET" ? convertQuery(req) : req.body;
  next();
}

/**
 * Turn an Express query object into a simple dictionary of strings.
 */
function convertQuery(req: Request): Record<string, string> {
  return Object.fromEntries(
    Object.entries(req.query).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].length > 0
    )
  ) as Record<string, string>;
}
