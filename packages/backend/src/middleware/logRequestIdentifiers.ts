import type { NextFunction, Request, Response } from "express";
import type { Bag } from "../types/types.ts";
import { logError, logProperty } from "../utils/telemetry.ts";

const idQueryStrings = ["visitorId", "sessionId"] as const;
const idHeaders = ["jb-visitor-id", "jb-session-id"] as const;
const useQs = ["/api/job/apply"];

/**
 * Logs client-provided identifiers from request into telemetry context.
 */
export function logIdentifiers(req: Request, _: Response, next: NextFunction) {
  try {
    const isQs = req.method === "GET" && useQs.includes(req.path);
    const [visitor, session] = isQs ? idQueryStrings : idHeaders;
    const bag = isQs ? req.query : req.headers;
    logId("visitorId", bag, visitor);
    logId("sessionId", bag, session);
  } catch (error) {
    // Log but don't block on telemetry issues
    logError(error);
  }
  next();
}

function logId(name: string, bag: Bag, key: string) {
  const idRaw = bag[key];
  const id = typeof idRaw === "string" ? idRaw.trim() : "";
  if (id) {
    logProperty(name, id);
  }
}
