import { Query } from "dry-utils-cosmosdb";
import { llm } from "../ai/llm.ts";
import { db } from "../db/db.ts";
import type { Filters } from "../models/clientModels.ts";
import type { Job, JobKey, Location } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { MS_PER_DAY } from "../utils/constants.ts";
import { logProperty } from "../utils/telemetry.ts";

type EnhancedFilters = Omit<Filters, "location"> & {
  location?: Location;
};

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

    const job = await db.job.get({
      id: jobId,
      companyId,
    });

    const result = job ? [job] : [];
    logProperty(
      "GetJobs_Id",
      `${companyId}_${jobId}_${job ? "Found" : "NotFound"}`,
    );
    return result;
  }

  // US-only transition:
  // If no location provided, assume US-based
  const queryLocation: Location = await llm.extractLocation(
    filterInput.location ?? "",
  );
  queryLocation.countryCode ||= "US";

  const country = queryLocation.countryCode;
  if (country && country.toUpperCase() !== "US") {
    // US-only transition:
    // If a user searches for a non-US location, return no results (even though they may exist in the DB for now).
    logProperty("GetJobs_NonUSCountry", country);
    return [];
  }

  const filters: EnhancedFilters = {
    ...filterInput,
    location: queryLocation,
  };

  const result = await readJobsByFilters(filters);
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
  location,
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
}: EnhancedFilters) {
  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the QueryBuilder class comment for ordering guidelines
  const query = new Query();

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

  if (location) {
    const remoteMatch = "c.presence = 'remote'";
    // Comment out for now since it doesn't take RemoteEligibility into account
    //const noLocationMatch = "c.locationSearchKey = '||||'";
    const countryMatch = `c.locationSearchKey = '|||US|'`;
    const regionMatch = `c.locationSearchKey = CONCAT('||', @regionCode, '|US|')`;

    let locClause = "";
    let remoteMatches: string[] = [];

    if (location.city) {
      locClause = `c.locationSearchKey = CONCAT('|', @city, '|', @regionCode, '|US|')`;
      remoteMatches = [regionMatch, countryMatch];
      //remoteMatches = [regionMatch, countryMatch, noLocationMatch];
    } else if (location.regionCode) {
      locClause = `ENDSWITH(c.locationSearchKey, CONCAT('|', @regionCode, '|US|'))`;
      remoteMatches = [countryMatch];
      //remoteMatches = [countryMatch, noLocationMatch];
    } else if (location.countryCode) {
      locClause = `ENDSWITH(c.locationSearchKey, '|US|')`;
      remoteMatches = [];
      //remoteMatches = [noLocationMatch];
    }

    if (isRemote !== false && remoteMatches.length) {
      locClause += ` OR (${remoteMatch} AND (${remoteMatches.join(" OR ")}))`;
    }

    if (locClause) {
      query.where([
        locClause,
        {
          "@city": location.city ?? "",
          "@regionCode": location.regionCode ?? "",
        },
      ]);
    }
  }

  // The limit of 24 items is intentional to prevent excessive data retrieval.
  return db.job.query<Job>(query.build(24));
}

// #endregion
