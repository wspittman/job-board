import { z } from "dry-utils-openai";
import type { Filters, RefreshJobsOptions } from "../models/clientModels.ts";
import {
  CompanyStage,
  JobFamily,
  JobOrderBy,
  PayCadence,
  UsState,
  WorkTimeBasis,
} from "../models/enums.ts";
import {
  AtsSchema,
  CompanyKeySchema,
  CompanyKeysSchema,
  FullJobKeySchema,
  IdSchema,
  JobKeySchema,
  type CompanyKey,
  type CompanyKeys,
  type FullJobKey,
  type JobKey,
} from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import { JOB_EXPIRY_DAYS } from "../utils/constants.ts";
import { stripObj } from "../utils/objUtils.ts";

// Z Helpers
type Z<T> = z.ZodType<T>;
const soft = <T>(zt: Z<T>) => zt.optional().catch(undefined);
const strPreProcess = <T>(zt: Z<T>, fn: (val: string) => string) =>
  z.preprocess((val) => (typeof val === "string" ? fn(val) : val), zt);
const lower = <T>(zt: Z<T>) => strPreProcess(zt, (s) => s.toLowerCase());
const upper = <T>(zt: Z<T>) => strPreProcess(zt, (s) => s.toUpperCase());
const coerceString = <T>(zt: Z<T>) => soft(z.preprocess(String, zt));
const coerceInt = <T>(zt: Z<T>) =>
  soft(
    z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      zt,
    ),
  );

// Basic Schema Components
const SearchSchema = z.string().trim().min(3).max(100);
const TimestampSchema = z
  .number()
  .min(new Date("2024-01-01").getTime())
  .refine((val) => val <= Date.now(), {
    message: "Timestamp cannot be in the future",
  });

const RefreshJobsOptionsSchema = z.strictObject({
  ats: AtsSchema.optional(),
  companyIds: z.array(IdSchema).nonempty().optional(),
  replaceJobsOlderThan: TimestampSchema.optional(),
});

const FiltersSchema = z.object({
  companyId: coerceString(IdSchema),
  jobId: coerceString(IdSchema),
  isRemote: coerceString(z.stringbool()),
  workTimeBasis: soft(lower(WorkTimeBasis)),
  jobFamily: soft(lower(JobFamily)),
  companyStage: soft(lower(CompanyStage)),
  payCadence: soft(lower(PayCadence)),
  currency: soft(
    z
      .string()
      .length(3)
      .regex(/^[a-z]+$/i)
      .toUpperCase(),
  ),
  title: soft(SearchSchema),
  city: soft(SearchSchema),
  state: soft(upper(UsState)),
  daysSince: coerceInt(z.int().positive().max(JOB_EXPIRY_DAYS)),
  maxExperience: coerceInt(z.int().nonnegative().max(100)),
  minSalary: coerceInt(z.int().positive().max(10_000_000)),
  orderBy: soft(lower(JobOrderBy)),
  refresh: coerceString(z.stringbool()),
});

const beaconSchema = z.object({
  tag: soft(IdSchema),
  visitorId: soft(z.uuid()),
  sessionId: soft(z.uuid()),
});

/**
 * Validate and log beacon data
 */
export function useBeacon(input: unknown): void {
  const { tag, visitorId, sessionId } = zParse(beaconSchema, input);
  if (tag) logProperty("tag", tag);
  if (visitorId) logProperty("visitorId", visitorId);
  if (sessionId) logProperty("sessionId", sessionId);
}

/**
 * Validate search filter options
 * @returns Validated Filters
 */
export function useFilters(input: unknown): Filters {
  const filters = stripObj(zParse(FiltersSchema, input));
  logProperty("Input_Filters", filters);
  return filters;
}

/**
 * Validate company identifiers
 * @returns Validated CompanyKey
 * @throws AppError if validation fails
 */
export function useCompanyKey(input: unknown): CompanyKey {
  const companyKey = zParse(CompanyKeySchema, input);
  logProperty("Input_CompanyKey", companyKey);
  return companyKey;
}

/**
 * Validate multiple company identifiers
 * @returns Validated CompanyKeys
 * @throws AppError if validation fails
 */
export function useCompanyKeys(input: unknown): CompanyKeys {
  const companyKeys = zParse(CompanyKeysSchema, input);
  logProperty("Input_CompanyKeys", companyKeys);
  return companyKeys;
}

/**
 * Validate job identifiers
 * @returns Validated JobKey
 * @throws AppError if validation fails
 */
export function useJobKey(input: unknown): JobKey {
  const jobKey = zParse(JobKeySchema, input);
  logProperty("Input_JobKey", jobKey);
  return jobKey;
}

/**
 * Validate company and job identifiers together
 * @returns Object containing validated CompanyKey and JobKey
 * @throws AppError if validation fails
 */
export function useFullJobKey(input: unknown): FullJobKey {
  const { companyId, jobId, ats } = zParse(FullJobKeySchema, input);
  const keys = {
    companyKey: { id: companyId, ats },
    jobKey: { id: jobId, companyId },
  };
  logProperty("Input_FullJobKey", keys);
  return keys;
}

/**
 * Validate refresh jobs options
 * @returns Validated RefreshJobsOptions
 * @throws AppError if validation fails
 */
export function useRefreshJobsOptions(input: unknown): RefreshJobsOptions {
  // Manually pre-process "now" -> Date.now()
  if (
    typeof input === "object" &&
    !!input &&
    "replaceJobsOlderThan" in input &&
    input.replaceJobsOlderThan === "now"
  ) {
    input.replaceJobsOlderThan = Date.now();
  }

  const options = zParse(RefreshJobsOptionsSchema, input);

  if (options.companyIds && !options.ats) {
    throw new AppError("ats field is required when using companyIds");
  }

  logProperty("Input_RefreshJobsOptions", options);
  return options;
}

const InterpretQuerySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

/**
 * Validate natural language query interpretation request
 * @returns Validated query string
 */
export function useInterpretQuery(input: unknown): string {
  const { query } = zParse(InterpretQuerySchema, input);
  logProperty("Input_InterpretQuery", query);
  return query;
}

/**
 * Parse and validate data using a Zod schema
 * @param zt - Zod schema to use for validation
 * @param data - Data to validate
 * @returns Validated data
 * @throws AppError if validation fails
 */
function zParse<T>(zt: Z<T>, data: unknown = {}): T {
  const result = zt.safeParse(data);
  if (!result.success) {
    const { path, message } = result.error.issues[0] ?? {};
    let pathStr = path?.join(".");
    pathStr = pathStr ? `${pathStr} field is invalid: ` : "";
    throw new AppError(`${pathStr}${message}`);
  }
  return result.data;
}
