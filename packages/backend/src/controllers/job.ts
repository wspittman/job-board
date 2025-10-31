import { batch } from "dry-utils-async";
import { Query } from "dry-utils-cosmosdb";
import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { Filters } from "../models/clientModels.ts";
import type { CompanyKey, Job, JobKey, Location } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";
import { logProperty } from "../utils/telemetry.ts";
import { metadataJobExecutor } from "./metadata.ts";

type EnhancedFilters = Omit<Filters, "location"> & {
  location?: Location;
};

const jobInfoQueue = new AsyncQueue(
  "RefreshJobInfo",
  refreshJobInfo,
  metadataJobExecutor
);

/**
 * Retrieves jobs matching the specified filters
 * @param filterInput - Filter criteria for jobs search
 * @returns Array of jobs matching the filters, empty if no filters provided
 */
export async function getJobs(filterInput: Filters) {
  if (!Object.keys(filterInput).length) {
    return [];
  }

  const filters: EnhancedFilters = {
    ...filterInput,
    location: await llm.extractLocation(filterInput.location ?? ""),
  };

  const result = await readJobsByFilters(filters);
  logProperty("GetJobs_Count", result.length);
  return result;
}

/**
 * Removes a job from the database
 * @param key - Job identifier containing id and companyId
 * @returns Promise resolving when the job is deleted
 */
export async function removeJob(key: JobKey) {
  return db.job.remove(key);
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

/**
 * Refreshes jobs for a specific company by synchronizing with ATS
 * @param key - Company identifier and optional timestamp to replace older jobs
 * @returns Promise resolving when jobs are refreshed
 */
export async function refreshJobsForCompany(
  key: CompanyKey & { replaceJobsOlderThan?: number }
) {
  logProperty("Input", key);
  const companyId = key.id;
  const currentIds = await getJobIds(companyId, key.replaceJobsOlderThan);
  const [add, remove, ignore] = await getAtsJobs(key, currentIds);

  logProperty("Ignored", ignore);

  if (remove.length) {
    await batch("DeleteJob", remove, (id) =>
      db.job.remove({ id, companyId: key.id })
    );
  }

  if (add.length) {
    const company = await db.company.get(key);

    if (!company) return;

    add.forEach(({ item }) => {
      item.companyName = company.name;

      if (company.stage) item.companyStage = company.stage;
      if (company.size) item.companySize = company.size;
    });

    jobInfoQueue.add(add.map((job) => [key, job]));
  }
}

async function getJobIds(companyId: string, cutoffMS?: number) {
  if (!cutoffMS) {
    return await db.job.getIds(companyId);
  }

  // CosmosDB uses seconds, not milliseconds
  const cutoff = cutoffMS / 1000;
  const pairs = await db.job.getIdsAndTimestamps(companyId);
  // Pretend we don't have jobs added before the cutoff
  return pairs.filter(({ _ts }) => _ts >= cutoff).map(({ id }) => id);
}

async function getAtsJobs(key: CompanyKey, currentIds: string[]) {
  // If there are no current jobs, assume newly added company and get full job data for all jobs
  const getFullJobInfo = !currentIds.length;
  let atsJobs = await ats.getJobs(key, getFullJobInfo);

  // Create sets for faster comparisons
  const jobIdSet = new Set(atsJobs.map(({ item: { id } }) => id));
  const currentIdSet = new Set(currentIds);

  // Any ATS job not in the current set needs to be added
  let add = atsJobs.filter(({ item: { id } }) => !currentIdSet.has(id));

  // Any jobs in the current set but not in the ATS need to be removed
  const remove = currentIds.filter((id) => !jobIdSet.has(id));

  // If job is in both ATS and DB should be ignored
  const ignore = jobIdSet.size - add.length;

  // Get the full job data for all jobs if
  // - There is more than 1 added job
  // - More than 10% of jobs are new
  // - We don't already have full job data
  // Better to do one big API call with unnecessary data than many small API calls
  if (
    add.length > 1 &&
    9 * add.length > remove.length + ignore &&
    !atsJobs[0]?.context
  ) {
    atsJobs = await ats.getJobs(key, true);
    add = atsJobs.filter(({ item: { id } }) => !currentIdSet.has(id));
  }

  return [add, remove, ignore] as const;
}

async function refreshJobInfo([companyKey, job]: [CompanyKey, Context<Job>]) {
  logProperty("Input", { ...companyKey, jobId: job.item.id });

  if (!job.context) {
    job = await ats.getJob(companyKey, job.item);
  }

  const success = await llm.fillJobInfo(job);

  // Do not add a job that failed to extract facets
  if (!success) {
    return;
  }

  await db.job.upsert(job.item);
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
}: EnhancedFilters) {
  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the QueryBuilder class comment for ordering guidelines
  const query = new Query();

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

  if (daysSince) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const sinceTS = Date.now() - daysSince * millisecondsPerDay;
    query.whereCondition("postTS", ">=", sinceTS);
  }

  if (maxExperience != null) {
    query.whereCondition("requiredExperience", "<=", maxExperience);
  }

  if (minSalary) {
    query.whereCondition("salaryRange.min", ">=", minSalary);
  }

  if (title) {
    query.whereCondition("title", "CONTAINS", title);
  }

  if (location) {
    const remoteMatch = "c.presence = 'remote'";
    // Comment out for now since it doesn't take RemoteEligibility into account
    //const noLocationMatch = "c.locationSearchKey = '||||'";
    const countryMatch = `c.locationSearchKey = CONCAT('|||', @countryCode, '|')`;
    const regionMatch = `c.locationSearchKey = CONCAT('||', @regionCode, '|', @countryCode, '|')`;

    let locClause = "";
    let remoteMatches: string[] = [];

    if (location.city) {
      locClause = `c.locationSearchKey = CONCAT('|', @city, '|', @regionCode, '|', @countryCode, '|')`;
      remoteMatches = [regionMatch, countryMatch];
      //remoteMatches = [regionMatch, countryMatch, noLocationMatch];
    } else if (location.regionCode) {
      locClause = `ENDSWITH(c.locationSearchKey, CONCAT('|', @regionCode, '|', @countryCode, '|'))`;
      remoteMatches = [countryMatch];
      //remoteMatches = [countryMatch, noLocationMatch];
    } else if (location.countryCode) {
      locClause = `ENDSWITH(c.locationSearchKey, CONCAT('|', @countryCode, '|'))`;
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
          "@countryCode": location.countryCode ?? "",
        },
      ]);
    }
  }

  // The limit of 24 items is intentional to prevent excessive data retrieval.
  return db.job.query<Job>(query.build(24));
}

// #endregion
