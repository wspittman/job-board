import type { Filters, RefreshJobsOptions } from "../types/clientModels";
import type { ATS, CompanyKey, CompanyKeys, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { logProperty } from "../utils/telemetry";

/**
 * Validate search filter options
 * @returns Validated Filters
 */
export function useFilters({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
}: any = {}): Filters {
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

/**
 * Validate company identifiers
 * @returns Validated CompanyKey
 * @throws AppError if validation fails
 */
export function useCompanyKey({ id, ats }: any = {}): CompanyKey {
  const companyKey = {
    id: validateId("id", id),
    ats: validateAts("ats", ats),
  };
  logProperty("Input_CompanyKey", companyKey);
  return companyKey;
}

/**
 * Validate multiple company identifiers
 * @returns Validated CompanyKeys
 * @throws AppError if validation fails
 */
export function useCompanyKeys({ ids, ats }: any = {}): CompanyKeys {
  const companyKeys = {
    ids: validateIds("ids", ids),
    ats: validateAts("ats", ats),
  };
  logProperty("Input_CompanyKeys", companyKeys);
  return companyKeys;
}

/**
 * Validate job identifiers
 * @returns Validated JobKey
 * @throws AppError if validation fails
 */
export function useJobKey({ id, companyId }: any = {}): JobKey {
  const jobKey = {
    id: validateId("id", id),
    companyId: validateId("companyId", companyId),
  };
  logProperty("Input_JobKey", jobKey);
  return jobKey;
}

export function useRefreshJobsOptions({
  ats,
  companyId,
  replaceJobsOlderThan,
  ...rest
}: any = {}): RefreshJobsOptions {
  const options: RefreshJobsOptions = {};

  if (Object.keys(rest).length) {
    throw new AppError("Unknown options");
  }

  if (ats) {
    options.ats = validateAts("ats", ats);
  }

  if (companyId) {
    options.companyId = validateId("companyId", companyId);
  }

  if (options.companyId && !options.ats) {
    throw new AppError("ats field is required when using companyId");
  }

  if (replaceJobsOlderThan) {
    options.replaceJobsOlderThan = validateTimestamp(
      "replaceJobsOlderThan",
      replaceJobsOlderThan,
      new Date("2024-01-01").getTime(),
      Date.now()
    );
  }

  logProperty("Input_RefreshJobsOptions", options);
  return options;
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

function validateTimestamp(
  field: string,
  timestamp: unknown,
  min?: number,
  max?: number
): number {
  if (!timestamp) {
    throw new AppError(`${field} field is required`);
  }

  if (typeof timestamp !== "number") {
    throw new AppError(`${field} field is invalid`);
  }

  if (!Number.isFinite(timestamp)) {
    throw new AppError(`${field} field is invalid`);
  }

  if (min && timestamp < min) {
    throw new AppError(`${field} field is too low`);
  }

  if (max && timestamp > max) {
    throw new AppError(`${field} field is too high`);
  }

  return timestamp;
}
