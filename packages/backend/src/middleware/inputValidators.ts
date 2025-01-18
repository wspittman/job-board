import { ATS } from "../db/models";
import { Filters } from "../types/clientModels";
import { AppError } from "../utils/AppError";
import { logProperty } from "../utils/telemetry";

export function useFilters({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
}: any = {}) {
  const filters: Filters = {};

  if (companyId && companyId.length < 100) {
    filters.companyId = companyId;
  }

  if (isRemote != null) {
    filters.isRemote = isRemote.toLowerCase() === "true";
  }

  if (title?.length > 2 && title.length < 100) {
    filters.title = title;
  }

  if (location?.length > 2 && location.length < 100) {
    filters.location = location;
  }

  if (daysSince) {
    const value = parseInt(daysSince);

    if (Number.isFinite(value) && value >= 1 && value <= 365) {
      filters.daysSince = value;
    }
  }

  if (maxExperience != null) {
    const value = parseInt(maxExperience);
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      filters.maxExperience = value;
    }
  }

  if (minSalary) {
    const value = parseInt(minSalary);
    if (Number.isFinite(value) && value >= 1 && value <= 10000000) {
      filters.minSalary = value;
    }
  }

  logProperty("Input_Filters", filters);
  return filters;
}

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
