import type { CompanyKey, CompanyKeys } from "../models/models.ts";
import type { Filters, RefreshJobsOptions } from "../types/clientModels.ts";
import type { ATS, JobKey } from "../types/dbModels.ts";
import { AppError } from "../utils/AppError.ts";
import { logProperty } from "../utils/telemetry.ts";

const MAX_ID_LENGTH = 100;
const MAX_ARRAY_LENGTH = 50;
const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 100;
const MIN_DAYS = 1;
const MAX_DAYS = 365;
const MIN_EXPERIENCE = 0;
const MAX_EXPERIENCE = 100;
const MIN_SALARY = 1;
const MAX_SALARY = 10000000;

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

  if (companyId && companyId.length <= MAX_ID_LENGTH) {
    filters.companyId = companyId;
  }

  if (isRemote != null) {
    filters.isRemote = String(isRemote).toLowerCase() === "true";
  }

  if (title?.length >= MIN_SEARCH_LENGTH && title.length <= MAX_SEARCH_LENGTH) {
    filters.title = title;
  }

  if (
    location?.length >= MIN_SEARCH_LENGTH &&
    location.length <= MAX_SEARCH_LENGTH
  ) {
    filters.location = location;
  }

  if (daysSince) {
    const value = parseInt(daysSince);

    if (Number.isFinite(value) && value >= MIN_DAYS && value <= MAX_DAYS) {
      filters.daysSince = value;
    }
  }

  if (maxExperience != null) {
    const value = parseInt(maxExperience);
    if (
      Number.isFinite(value) &&
      value >= MIN_EXPERIENCE &&
      value <= MAX_EXPERIENCE
    ) {
      filters.maxExperience = value;
    }
  }

  if (minSalary) {
    const value = parseInt(minSalary);
    if (Number.isFinite(value) && value >= MIN_SALARY && value <= MAX_SALARY) {
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

/**
 * Validate refresh jobs options
 * @returns Validated RefreshJobsOptions
 * @throws AppError if validation fails
 */
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

  if (replaceJobsOlderThan === "now") {
    options.replaceJobsOlderThan = Date.now();
  } else if (replaceJobsOlderThan) {
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

  if (id.length > MAX_ID_LENGTH) {
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

  if (ids.length > MAX_ARRAY_LENGTH) {
    throw new AppError(`${field} field has too many items`);
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
