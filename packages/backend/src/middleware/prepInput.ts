import { NextFunction, Request, Response } from "express";

/**
 * Middleware to prepare input for controllers.
 */
export function prepInput(req: Request, res: Response, next: NextFunction) {
  res.locals.input = req.method === "GET" ? convertQuery(req) : req.body;
  next();
}

/**
 * Turn a Express query object into a simple dictionary.
 */
function convertQuery(req: Request) {
  const query = req.query;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length) {
      result[key] = value;
    }
  }

  return result;
}
