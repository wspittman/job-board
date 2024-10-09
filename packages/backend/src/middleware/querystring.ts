import { NextFunction, Request, Response } from "express";

/**
 * Turn a Express query object into a simple dictionary.
 */
export function convertQuery(req: Request, res: Response, next: NextFunction) {
  const query = req.query;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length) {
      result[key] = value;
    }
  }

  res.locals.query = result;
  next();
}

export function getQuery(res: Response): Record<string, string> {
  return res.locals.query;
}
