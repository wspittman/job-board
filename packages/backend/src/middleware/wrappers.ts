import type { NextFunction, Request, Response } from "express";
import { logError, withAsyncContext } from "../utils/telemetry.ts";

const SUCCESS = { status: "success" };

/**
 * Creates an Express route handler that processes JSON requests and responses
 * @param fn - Async function that processes the validated input and returns a result
 * @param inputValidator - Optional function to validate and transform the input
 * @param outputFormatter - Optional function to format the output before sending
 * @returns Express middleware that handles the request
 * @throws Forwards any errors to Express error handler
 */
export function jsonRoute<IN, OUT>(
  fn: (input: IN) => Promise<OUT>,
  inputValidator?: (input: unknown) => IN,
  outputFormatter?: (output: OUT) => unknown
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = getInput(req, inputValidator);
      const result = await fn(input);
      const output = outputFormatter ? outputFormatter(result) : result;
      res.json(output ?? SUCCESS);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Creates an Express route handler for long-running async operations
 * @param fn - Async function that processes the validated input
 * @param inputValidator - Optional function to validate and transform the input
 * @returns Express middleware that immediately responds with 202 Accepted
 */
export function asyncRoute<T>(
  fn: (input: T) => Promise<void>,
  inputValidator?: (input: unknown) => T
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = getInput(req, inputValidator);
      res.writeHead(202, { "Content-Type": "text/plain" });
      res.end("Accepted");

      const logName = pathToLogName(req.path);
      await withAsyncContext(logName, async () => fn(input));
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        logError(error);
      }
    }
  };
}

/**
 * Creates an Express route handler for redirects
 * @param fn - Async function that returns the redirect URL based on validated input
 * @param inputValidator - Optional function to validate and transform the input
 * @returns Express middleware that handles the request
 */
export function redirectRoute<IN>(
  fn: (input: IN) => Promise<string>,
  inputValidator?: (input: unknown) => IN
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = getInput(req, inputValidator);
      const redirectUrl = await fn(input);
      res.redirect(302, redirectUrl);
    } catch (error) {
      next(error);
    }
  };
}

function pathToLogName(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((x) => x[0]?.toUpperCase() + x.slice(1))
    .join("");
}

/**
 * Get the input from the request, optionally validating it.
 */
function getInput<T>(req: Request, validator?: (input: unknown) => T) {
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
