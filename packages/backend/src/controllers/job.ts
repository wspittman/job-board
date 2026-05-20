import { Query } from "dry-utils-cosmosdb";
import { llm } from "../ai/llm.ts";
import { db } from "../db/db.ts";
import type { Filters } from "../models/clientModels.ts";
import type { Job, JobKey } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { MS_PER_DAY } from "../utils/constants.ts";
import { logProperty } from "../utils/telemetry.ts";

/**
 * Retrieves jobs matching the specified filters
 * @param filterInput - Filter criteria for jobs search
 * @returns Array of jobs matching the filters, empty if no filters provided
 */
export async function getJobs(filterInput: Filters) {
  if (!Object.keys(filterInput).length) {
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

  if (city || state) {
    const remoteMatch = "c.presence = 'remote'";
    // Marked as US or worldwide remote
    const countryMatch = `c.locationSearchKey = '|||US|' OR c.locationSearchKey = '||||'`;
    const stateMatch = `c.locationSearchKey = CONCAT('||', @state, '|US|')`;

    let locClause: string;
    let remoteMatches = [countryMatch];

    if (city && state) {
      locClause = `c.locationSearchKey = CONCAT('|', @city, '|', @state, '|US|')`;
      remoteMatches = [stateMatch, countryMatch];
    } else if (state) {
      locClause = `ENDSWITH(c.locationSearchKey, CONCAT('|', @state, '|US|'))`;
    } else {
      // city only — match city in any state
      locClause = `STARTSWITH(c.locationSearchKey, CONCAT('|', @city, '|'))`;
    }

    if (isRemote !== false) {
      locClause += ` OR (${remoteMatch} AND (${remoteMatches.join(" OR ")}))`;
    }

    query.where([
      locClause,
      {
        "@city": city ?? "",
        "@state": state ?? "",
      },
    ]);
  }

  return db.job.query<Job>(query.orderBy("_ts", "DESC").build());
}

// #endregion
