import { NextFunction, Request, Response } from "express";
import { withAsyncContext } from "../utils/telemetry";

const SUCCESS = { status: "success" };

export function jsonRoute<T>(
  fn: (input: T) => Promise<unknown>,
  inputValidator?: (input: any) => T
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = getInput(req, inputValidator);
      const result = await fn(input);
      res.json(result ?? SUCCESS);
    } catch (error: any) {
      next(error);
    }
  };
}

export function asyncRoute<T>(
  name: string,
  fn: (input: T) => Promise<unknown>,
  inputValidator?: (input: any) => T
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const input = getInput(req, inputValidator);
    res.writeHead(202, { "Content-Type": "text/plain" });
    res.end("Accepted");
    withAsyncContext(name, async () => {
      fn(input);
    });
  };
}

/**
 * Get the input from the request, optionally validating it.
 */
function getInput<T>(req: Request, validator?: (input: any) => T) {
  const rawInput = req.method === "GET" ? convertQuery(req) : req.body;
  return validator ? validator(rawInput) : rawInput;
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
