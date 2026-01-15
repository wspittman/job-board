import type { NextFunction, Request, Response } from "express";
import type { Bag } from "../types/types.ts";
import { logError } from "../utils/telemetry.ts";
import { useBeacon } from "./inputValidators.ts";

const visitorHeader = "jb-visitor-id";
const sessionHeader = "jb-session-id";
const useQs = ["/api/job/apply"];

/**
 * Logs client-provided identifiers from request into telemetry context.
 */
export function logIdentifiers(req: Request, _: Response, next: NextFunction) {
  try {
    const bag: Bag = {
      visitorId: req.headers[visitorHeader],
      sessionId: req.headers[sessionHeader],
    };

    if (req.method === "GET" && useQs.includes(req.path)) {
      bag["visitorId"] ??= req.query["visitorId"];
      bag["sessionId"] ??= req.query["sessionId"];
    }

    useBeacon(bag);
  } catch (error) {
    // Log but don't block on telemetry issues
    logError(error);
  }
  next();
}
