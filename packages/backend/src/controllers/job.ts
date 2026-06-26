import { Query, type Where } from "dry-utils-cosmosdb";
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
const JOB_ORDER_BY: Record<JobOrderBy, [string, "ASC" | "DESC"]> = {
  post_time: ["postTS", "DESC"],
  highest_salary: ["salaryRange.min", "DESC"],
  lowest_experience: ["requiredExperience", "ASC"],
};

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
  currency,
  orderBy,
  refresh,
}: Filters) {
  // The limit of 24 items is intentional to prevent excessive data retrieval.
  const query = new Query().top(24);

  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the QueryBuilder class comment for ordering guidelines

  // Exact Matches

  if (companyId) {
    query.whereCondition("companyId", "=", companyId);
  }

  if (isRemote != undefined) {
    if (isRemote) {
      query.whereCondition("presence", "=", "remote");
    } else {
      query.where(['(c.presence = "onsite" OR c.presence = "hybrid")']);
    }
  }

  if (workTimeBasis) {
    query.whereCondition("workTimeBasis", "=", workTimeBasis);
  }

  if (jobFamily) {
    query.whereCondition("jobFamily", "=", jobFamily);
  }

  if (companyStage) {
    query.whereCondition("companyStage", "=", companyStage);
  }

  if (payCadence) {
    query.whereCondition("salaryRange.cadence", "=", payCadence);
  }

  if (currency) {
    query.whereCondition("salaryRange.currency", "=", currency.toUpperCase());
  }

  // Range Matches

  if (daysSince) {
    const sinceTS = Date.now() - daysSince * MS_PER_DAY;
    query.whereCondition("postTS", ">=", sinceTS);
  }

  if (maxExperience != null) {
    query.whereCondition("requiredExperience", "<=", maxExperience);
  }

  if (minSalary) {
    query.whereCondition("salaryRange.min", ">=", minSalary);
  }

  if (refresh) {
    const cutoffSeconds = Math.floor((Date.now() - MS_PER_DAY) / 1000);
    query.whereCondition("_ts", ">=", cutoffSeconds);
  }

  // Substring Matches

  if (title) {
    query.whereCondition("title", "CONTAINS", title);
  }

  const locationWhere = buildLocationWhere({ city, state, isRemote });
  if (locationWhere) {
    query.where(locationWhere);
  }

  applyJobOrder(query, orderBy);

  return db.job.query<Job>(query.build());
}

/**
 * Applies the allow-listed job result ordering to a query.
 */
export function applyJobOrder(query: Query, orderBy: JobOrderBy = "post_time") {
  if (orderBy && JOB_ORDER_BY[orderBy]) {
    query.orderBy(...JOB_ORDER_BY[orderBy]);
  }
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
  city,
  state,
  isRemote,
}: Filters): Where | undefined {
  if (!city && !state) {
    return undefined;
  }

  const presenceRemote = "c.presence = 'remote'";

  const noCity = `NOT IS_DEFINED(c.primaryLocation.city)`;
  const noRegion = `NOT IS_DEFINED(c.primaryLocation.regionCode)`;
  const noCountry = `NOT IS_DEFINED(c.primaryLocation.countryCode)`;

  const usCountry = `c.primaryLocation.countryCode = 'US'`;
  const stateMatch = `c.primaryLocation.regionCode = @state`;
  const cityMatch = `(CONTAINS(c.primaryLocation.city, @city, true) OR CONTAINS(@city, c.primaryLocation.city, true))`;

  const usOrGlobal = `(${usCountry} OR ${noCountry})`;
  const countryWideRemote = `${noCity} AND ${noRegion} AND ${usOrGlobal}`;
  const stateWideRemote = `${noCity} AND ${stateMatch} AND ${usCountry}`;

  let locClause: string;
  let remoteMatches = [countryWideRemote];

  if (city && state) {
    locClause = `${usCountry} AND ${stateMatch} AND ${cityMatch}`;
    remoteMatches = [stateWideRemote, countryWideRemote];
  } else if (state) {
    locClause = `${usCountry} AND ${stateMatch}`;
  } else {
    locClause = `${usCountry} AND ${cityMatch}`;
  }

  if (isRemote !== false) {
    locClause += ` OR (${presenceRemote} AND (${remoteMatches.join(" OR ")}))`;
  }

  return [
    locClause,
    {
      "@city": city ?? "",
      "@state": state ?? "",
    },
  ];
}

// #endregion
