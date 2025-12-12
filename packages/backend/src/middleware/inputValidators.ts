import { z } from "dry-utils-openai";
import type { Filters, RefreshJobsOptions } from "../models/clientModels.ts";
import { JobFamily, PayCadence, WorkTimeBasis } from "../models/enums.ts";
import type { CompanyKey, CompanyKeys, JobKey } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { stripObj } from "../utils/objUtils.ts";
import { logProperty } from "../utils/telemetry.ts";

// Z Helpers
type Z<T> = z.ZodType<T>;
const zArray = <T>(zt: Z<T>) => z.array(zt).nonempty().max(50);
const soft = <T>(zt: Z<T>) => zt.optional().catch(undefined);
const coerceString = <T>(zt: Z<T>) => soft(z.preprocess(String, zt));
const coerceInt = <T>(zt: Z<T>) =>
  soft(
    z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      zt,
    ),
  );

// Basic Schema Components
const AtsSchema = z.enum(["greenhouse", "lever"] as const);
const IdSchema = z.string().trim().nonempty().max(100);
const SearchSchema = z.string().trim().min(3).max(100);
const TimestampSchema = z
  .number()
  .min(new Date("2024-01-01").getTime())
  .refine((val) => val <= Date.now(), {
    message: "Timestamp cannot be in the future",
  });

// Key Schemas
const CompanyKeySchema = z.object({ id: IdSchema, ats: AtsSchema });
const CompanyKeysSchema = z.object({ ids: zArray(IdSchema), ats: AtsSchema });
const JobKeySchema = z.object({ id: IdSchema, companyId: IdSchema });

const RefreshJobsOptionsSchema = z.strictObject({
  ats: AtsSchema.optional(),
  companyId: IdSchema.optional(),
  replaceJobsOlderThan: TimestampSchema.optional(),
});

const FiltersSchema = z.object({
  companyId: coerceString(IdSchema),
  jobId: coerceString(IdSchema),
  isRemote: coerceString(z.stringbool()),
  workTimeBasis: soft(WorkTimeBasis),
  jobFamily: soft(JobFamily),
  payCadence: soft(PayCadence),
  title: soft(SearchSchema),
  location: soft(SearchSchema),
  daysSince: coerceInt(z.int().positive().max(365)),
  maxExperience: coerceInt(z.int().nonnegative().max(100)),
  minSalary: coerceInt(z.int().positive().max(10_000_000)),
});

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

  if (options.companyId && !options.ats) {
    throw new AppError("ats field is required when using companyId");
  }

  logProperty("Input_RefreshJobsOptions", options);
  return options;
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
    throw new AppError(`${path?.join(".")} field is invalid: ${message}`);
  }
  return result.data;
}
