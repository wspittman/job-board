import type { Resource } from "@azure/cosmos";
import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import { QueryBuilder } from "../db/QueryBuilder";
import type { Filters } from "../types/clientModels";
import type { CompanyKey, Job, JobKey } from "../types/dbModels";
import type { Context } from "../types/types";
import { asyncBatch } from "../utils/asyncBatch";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";
import { metadataJobExecutor } from "./metadata";

interface EnhancedFilters extends Filters {
  normalizedLocation?: string;
}

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

  let filters: EnhancedFilters = { ...filterInput };
  if (filters.location) {
    const location = await llm.extractLocation(filters.location);
    if (location) {
      filters.normalizedLocation = location;
    }
  }

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
    // To keep things the same for the client until we update data model
    const company = await db.company.get(key);
    if (company?.name) {
      add.forEach((job) => {
        job.item.company = company.name;
      });
    }

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

  await llm.extractLocations(job);
  await llm.extractFacets(job);

  // Do not add a job that failed to extract facets
  if (!Object.keys(job.item.facets).length) {
    return;
  }

  await db.job.upsert(job.item);
}

// #region DB Operations

async function readJobsByFilters({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
  normalizedLocation,
}: EnhancedFilters) {
  /*
  Where clauses should ideally be ordered by
  1. The most selective filter first (ie. likely to filter out the most documents)
  2. Filter efficiency (equality > range > contains)
  */

  const query = new QueryBuilder();

  if (companyId) {
    query.where("c.companyId = @companyId", { "@companyId": companyId });
  }

  if (isRemote !== undefined) {
    query.where("c.isRemote = @isRemote", { "@isRemote": isRemote });
  }

  if (daysSince) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const sinceTS = Date.now() - daysSince * millisecondsPerDay;
    query.where("c.postTS >= @sinceTS", { "@sinceTS": sinceTS });
  }

  if (maxExperience != null) {
    // If undefined: include, since we can't yet distinguish between entry level and absent
    query.where(
      "NOT IS_DEFINED(c.facets.experience) OR c.facets.experience <= @maxExperience",
      { "@maxExperience": maxExperience }
    );
  }

  if (minSalary) {
    // If undefined: exclude
    query.where("c.facets.salary >= @minSalary", { "@minSalary": minSalary });
  }

  if (title) {
    query.where("CONTAINS(LOWER(c.title), @title)", {
      "@title": title.toLowerCase(),
    });
  }

  if (normalizedLocation) {
    addLocationClause(query, normalizedLocation, isRemote);
  } else if (location) {
    // Remote + empty location always matches
    query.where(
      '(c.isRemote = true AND c.location = "") OR CONTAINS(LOWER(c.location), @location)',
      { "@location": location.toLowerCase() }
    );
  }

  return db.job.query<Job & Resource>(query.build());
}

function addLocationClause(
  query: QueryBuilder,
  location: string,
  isRemote?: boolean
) {
  location = location.toLowerCase();
  const country = location.split(",").at(-1)?.trim() ?? location;
  const hybridParam = { "@location": location };
  const hybridClause = "ENDSWITH(LOWER(c.location), @location)";
  // Remote + empty location always matches
  const remoteParam = { "@country": country };
  const remoteClause =
    'ENDSWITH(LOWER(c.location), @country) OR c.location = ""';

  if (isRemote) {
    query.where(remoteClause, remoteParam);
  } else if (isRemote === false) {
    query.where(hybridClause, hybridParam);
  } else {
    query.where(
      `${hybridClause} OR (c.isRemote = true AND (${remoteClause}))`,
      {
        ...hybridParam,
        ...remoteParam,
      }
    );
  }
}

// #endregion
