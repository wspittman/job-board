import {
  buildQuery,
  Where,
  type OrderBy,
  type WhereInput,
} from "dry-utils-cosmosdb";
import { llm } from "../ai/llm.ts";
import { db } from "../db/db.ts";
import type { Filters } from "../models/clientModels.ts";
import type { JobOrderBy } from "../models/enums.ts";
import type { Job, JobKey } from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import { MS_PER_DAY } from "../utils/constants.ts";

// Cosmos DB sorts missing values below defined numbers. That means:
// - DESC numeric sorts place missing values after all defined values.
// - ASC numeric sorts place missing values before all defined values.
// Keep that behavior in mind when adding new order options. MockDB may not
// match Cosmos exactly here, so do not add IS_DEFINED guards just to satisfy
// mock ordering.
const JOB_ORDER_BY: Record<JobOrderBy, OrderBy> = {
  post_time: ["postTS", "DESC"],
  highest_salary: ["salaryRange.min", "DESC"],
  lowest_experience: ["requiredExperience", "ASC"],
} as const;

/**
 * Retrieves jobs matching the specified filters
 * @param filterInput - Filter criteria for jobs search
 * @returns Array of jobs matching the filters, empty if no filters provided
 */
export async function getJobs(filterInput: Filters) {
  if (!hasJobSearchFilters(filterInput)) {
    return [];
  }

  if (filterInput.jobId) {
    const { jobId, companyId } = filterInput;
    if (!companyId) return [];

    const job = await db.job.get({ id: jobId, companyId });

    const result = job ? [job] : [];
    logProperty(
      "GetJobs_Id",
      `${companyId}_${jobId}_${job ? "Found" : "NotFound"}`,
    );
    return result;
  }

  // Normalize city via LLM (handles typos, abbreviations, capitalization).
  // State is already validated and needs no normalization.
  const normalizedCity = filterInput.city
    ? await llm.extractLocation(filterInput.city)
    : undefined;

  const result = await readJobsByFilters({
    ...filterInput,
    city: normalizedCity,
  });
  logProperty("GetJobs_Count", result.length);
  return result;
}

/**
 * Retrieves the application redirect URL for a given job
 * @param key - Job identifier containing id and companyId
 * @returns URL to redirect the user to for job application
 */
export async function getApplyRedirectUrl(key: JobKey): Promise<string> {
  const job = await db.job.get(key);

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  const redirectUrl = new URL(job.applyUrl);
  redirectUrl.searchParams.set("utm_source", "betterjobboard.net");
  redirectUrl.searchParams.set("utm_medium", "apply");

  return redirectUrl.toString();
}

// #region DB Operations

async function readJobsByFilters({
  companyId,
  title,
  city,
  state,
  daysSince,
  maxExperience,
  minSalary,
  isRemote,
  workTimeBasis,
  jobFamily,
  companyStage,
  payCadence,
  orderBy = "post_time",
}: Filters) {
  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the Where class comment for ordering guidelines

  const clauses: WhereInput[] = [];

  // Exact Matches

  if (companyId) {
    clauses.push(["companyId", "=", companyId]);
  }

  if (isRemote != undefined) {
    if (isRemote) {
      clauses.push(["presence", "=", "remote"]);
    } else {
      clauses.push(
        Where.any(["presence", "=", "onsite"], ["presence", "=", "hybrid"]),
      );
    }
  }

  if (workTimeBasis) {
    clauses.push(["workTimeBasis", "=", workTimeBasis]);
  }

  if (jobFamily) {
    clauses.push(["jobFamily", "=", jobFamily]);
  }

  if (companyStage) {
    clauses.push(["companyStage", "=", companyStage]);
  }

  if (payCadence) {
    clauses.push(["salaryRange.cadence", "=", payCadence]);
  }

  // Range Matches

  if (daysSince) {
    const sinceTS = Date.now() - daysSince * MS_PER_DAY;
    clauses.push(["postTS", ">=", sinceTS]);
  }

  if (maxExperience != null) {
    clauses.push(["requiredExperience", "<=", maxExperience]);
  }

  if (minSalary) {
    clauses.push(["salaryRange.min", ">=", minSalary]);
  }

  // Substring Matches

  if (title) {
    clauses.push(["title", "CONTAINS", title]);
  }

  const locationWhere = buildLocationWhere({ city, state, isRemote });
  if (locationWhere) {
    clauses.push(locationWhere);
  }

  const jobOrder = JOB_ORDER_BY[orderBy];

  return db.job.query<Job>(
    buildQuery({
      // The limit of 24 items is intentional to prevent excessive data retrieval.
      top: 24,
      where: clauses,
      orderBy: [jobOrder],
    }),
  );
}

/**
 * Checks whether filters include at least one criterion that narrows job results.
 */
export function hasJobSearchFilters(filters: Filters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "orderBy" && value != null && value !== "",
  );
}

/**
 * Builds the location filter clause for job search queries.
 * @returns A Cosmos SQL WHERE clause and parameters, or undefined when no location filter is needed.
 */
export function buildLocationWhere({
  city = "",
  state = "",
  isRemote,
}: Filters): Where | undefined {
  if (!city && !state) {
    return undefined;
  }

  const cityField = "primaryLocation.city";
  const regionField = "primaryLocation.regionCode";

  const noCity = Where.raw(`NOT IS_DEFINED(c.${cityField})`);
  const noRegion = Where.raw(`NOT IS_DEFINED(c.${regionField})`);

  const stateMatch = Where.is(regionField, "=", state);
  const cityMatch = Where.any(Where.is(cityField, "CONTAINS", city), [
    `CONTAINS(@city, c.${cityField}, true)`,
    { "@city": city },
  ]);

  const remoteOk = isRemote !== false;
  const remote = Where.is("presence", "=", "remote");
  const countryOnly = Where.all(noCity, noRegion);
  const stateOnly = Where.all(noCity, stateMatch);

  const remoteCity = Where.all(remote, Where.any(stateOnly, countryOnly));
  const remoteCountry = Where.all(remote, countryOnly);

  if (city && state) {
    const inPerson = Where.all(stateMatch, cityMatch);
    return remoteOk ? Where.any(inPerson, remoteCity) : inPerson;
  }

  if (state) {
    return remoteOk ? Where.any(stateMatch, remoteCountry) : stateMatch;
  }

  return remoteOk ? Where.any(cityMatch, remoteCountry) : cityMatch;
}

// #endregion
