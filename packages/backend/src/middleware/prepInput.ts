import { NextFunction, Request, Response } from "express";
import type { ATS } from "../models/dbModels";
import { AppError } from "../utils/AppError";
import { logProperty } from "../utils/telemetry";

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

export function useCompanyKey(_: Request, res: Response, next: NextFunction) {
  const { id, ats } = res.locals.input ?? {};

  try {
    res.locals.input = {
      id: validateId("id", id),
      ats: validateAts("ats", ats),
    };
    logProperty("Input_CompanyKey", res.locals.input);
    next();
  } catch (error) {
    next(error);
  }
}

export function useCompanyKeys(_: Request, res: Response, next: NextFunction) {
  const { ids, ats } = res.locals.input ?? {};

  try {
    res.locals.input = {
      ids: validateIds("ids", ids),
      ats: validateAts("ats", ats),
    };
    logProperty("Input_CompanyKeys", res.locals.input);
    next();
  } catch (error) {
    next(error);
  }
}

export function useJobKey(_: Request, res: Response, next: NextFunction) {
  const { id, companyId } = res.locals.input ?? {};

  try {
    res.locals.input = {
      id: validateId("id", id),
      companyId: validateId("companyId", companyId),
    };
    logProperty("Input_JobKey", res.locals.input);
    next();
  } catch (error) {
    next(error);
  }
}

function validateId(field: string, id: unknown): string {
  if (!id) {
    throw new AppError(`${field} field is required`);
  }

  if (typeof id !== "string") {
    throw new AppError(`${field} field is invalid`);
  }

  if (id.length > 100) {
    throw new AppError(`${field} field is too long`);
  }

  return id;
}

function validateIds(field: string, ids: unknown): string[] {
  if (!ids) {
    throw new AppError(`${field} field is required`);
  }

  if (!Array.isArray(ids)) {
    throw new AppError(`${field} field is invalid`);
  }

  if (!ids.length) {
    throw new AppError(`${field} field is empty`);
  }

  return ids.map((id, i) => validateId(field + i, id));
}

function validateAts(field: string, ats: unknown): ATS {
  if (!ats) {
    throw new AppError(`${field} field is required`);
  }

  if (ats !== "greenhouse" && ats !== "lever") {
    throw new AppError(`${field} field is invalid`);
  }

  return ats;
}
