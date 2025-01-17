import type { ATS } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { logProperty } from "../utils/telemetry";

export function useCompanyKey({ id, ats }: any = {}) {
  const companyKey = {
    id: validateId("id", id),
    ats: validateAts("ats", ats),
  };
  logProperty("Input_CompanyKey", companyKey);
  return companyKey;
}

export function useCompanyKeys({ ids, ats }: any = {}) {
  const companyKeys = {
    ids: validateIds("ids", ids),
    ats: validateAts("ats", ats),
  };
  logProperty("Input_CompanyKeys", companyKeys);
  return companyKeys;
}

export function useJobKey({ id, companyId }: any = {}) {
  const jobKey = {
    id: validateId("id", id),
    companyId: validateId("companyId", companyId),
  };
  logProperty("Input_JobKey", jobKey);
  return jobKey;
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
