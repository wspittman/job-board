import type { Resource } from "@azure/cosmos";
import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import { Condition, Query } from "../db/Query";
import type { Filters } from "../types/clientModels";
import type { CompanyKey, Job, JobKey, Location } from "../types/dbModels";
import { Office, PayRate } from "../types/enums";
import type { Context } from "../types/types";
import { asyncBatch } from "../utils/asyncBatch";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";
import { metadataJobExecutor } from "./metadata";

type EnhancedFilters = Omit<Filters, "location" | "isRemote"> & {
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

  // Convert to filter inputs to Location object
  let location: Location | undefined = undefined;
  if (filterInput.location || filterInput.isRemote != undefined) {
    location = {
      location: filterInput.location,
      remote: filterInput.isRemote ? Office.Remote : undefined,
    };
  }
  if (location?.location) {
    await llm.extractLocation(location);
  }

  const filters: EnhancedFilters = {
    ...filterInput,
    location,
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
    await asyncBatch("DeleteJob", remove, (id) =>
      db.job.remove({ id, companyId: key.id })
    );
  }

  if (add.length) {
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
    !atsJobs[0].context
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

  if (await llm.fillJobInfo(job)) {
    // Only add the job if it was successfully filled
    await db.job.upsert(job.item);
  }
}

// #region DB Operations

async function readJobsByFilters({
  companyId,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
}: EnhancedFilters) {
  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the QueryBuilder class comment for ordering guidelines
  const query = new Query();

  if (companyId) {
    query.whereCondition("companyId", "=", companyId);
  }

  if (daysSince) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const sinceTS = Date.now() - daysSince * millisecondsPerDay;
    query.whereCondition("postTS", ">=", sinceTS);
  }

  if (minSalary) {
    query
      .whereCondition("compensation.rate", "=", PayRate.Salary)
      .whereCondition("compensation.minSalary", ">=", minSalary);
  }

  if (title) {
    query.whereCondition("title", "CONTAINS", title);
  }

  if (maxExperience != null) {
    query.whereTwinCondition("history", [["experience", "<=", maxExperience]]);
  }

  if (location) {
    addLocationClause(query, location);
  }

  return db.job.query<Job & Resource>(query.build());
}

function addLocationClause(
  query: Query,
  { location, remote, countryCode, stateCode, city }: Location
) {
  // Nothing to filter on
  if (remote === undefined && !location) return;

  const isRemote = remote === Office.Remote;
  let conditions: (Condition | undefined)[] = [];

  if (!location) {
    // Only searching based on remote status
    conditions = [getRemoteCondition(remote)];
  } else if (!countryCode) {
    // Substring string - no inference available
    conditions = [
      getRemoteCondition(remote),
      ["location", "CONTAINS", location],
    ];
  } else {
    // Searching based on inference matching
    if (remote === undefined) {
      // This is the complicated case, where we need to search both remote and non-remote
      // It is the combination of the two cases below it
      query.where(
        Query.or(
          Query.twinCondition(
            "location",
            getInferenceConditions(Office.Remote, countryCode)
          ),
          Query.twinCondition(
            "location",
            getInferenceConditions(Office.Onsite, countryCode, stateCode, city)
          )
        )
      );
      // We don't want the fallthrough, so explicitly return here
      return;
    } else if (isRemote) {
      conditions = getInferenceConditions(remote, countryCode);
    } else {
      conditions = getInferenceConditions(remote, countryCode, stateCode, city);
    }
  }

  query.whereTwinCondition("location", filterConditions(conditions));
}

function filterConditions(conditions: (Condition | undefined)[]): Condition[] {
  return conditions.filter(Boolean) as Condition[];
}

function getInferenceConditions(
  remote?: Office,
  countryCode?: string,
  stateCode?: string,
  city?: string
): Condition[] {
  return filterConditions([
    getRemoteCondition(remote),
    city ? ["city", "=", city] : undefined,
    stateCode ? ["stateCode", "=", stateCode] : undefined,
    countryCode ? ["countryCode", "=", countryCode] : undefined,
  ]);
}

function getRemoteCondition(remote?: Office): Condition | undefined {
  if (!remote) return undefined;
  return ["remote", remote === Office.Remote ? "=" : "<", Office.Remote];
}

// #endregion
