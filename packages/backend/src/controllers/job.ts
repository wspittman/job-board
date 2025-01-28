import type { Resource } from "@azure/cosmos";
import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import { QueryBuilder } from "../db/QueryBuilder";
import type { Filters } from "../types/clientModels";
import type { CompanyKey, Job, JobKey } from "../types/dbModels";
import { batchLog, BatchOptions, batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";

interface EnhancedFilters extends Filters {
  normalizedLocation?: string;
}

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
  return deleteJob(key);
}

/**
 * Refreshes jobs for a specific company by synchronizing with ATS
 * @param key - Company identifier and optional timestamp to replace older jobs
 * @param logPath - Optional array of strings for logging path
 * @returns Promise resolving when jobs are refreshed
 */
export async function refreshJobsForCompany(
  key: CompanyKey & { replaceJobsOlderThan?: number },
  logPath: string[] = []
) {
  const companyId = key.id;
  const batchOpts = { batchId: companyId, logPath };

  let currentIds: string[] = [];
  if (key.replaceJobsOlderThan) {
    // CosmosDB uses seconds, not milliseconds
    const cutoff = key.replaceJobsOlderThan / 1000;
    const pairs = await db.job.getIdsAndTimestamps(companyId);
    // Pretend we don't have jobs added before the cutoff
    currentIds = pairs.filter(({ _ts }) => _ts >= cutoff).map(({ id }) => id);
  } else {
    currentIds = await db.job.getIds(companyId);
  }

  const atsJobs = await ats.getJobs(key, true);

  // Figure out which jobs are added/removed/ignored
  const jobIdSet = new Set(atsJobs.map((item) => item.id));
  const currentIdSet = new Set(currentIds);

  // Any ATS job not in the current set needs to be added
  const added = atsJobs.filter((item) => !currentIdSet.has(item.id));

  // Any jobs in the current set but not in the ATS need to be deleted
  const removed = currentIds.filter((id) => !jobIdSet.has(id));

  // If job is in both ATS and DB, do nothing but keep a count
  const existing = jobIdSet.size - added.length;
  batchLog("Ignored", existing, batchOpts);

  if (removed.length) {
    await batchRun(
      removed,
      (id) => deleteJob({ id, companyId }),
      "DeleteJob",
      batchOpts
    );
  }

  if (added.length) {
    // To keep things the same for the client until we update data model
    const company = await db.company.get(key);
    if (company?.name) {
      added.forEach((job) => {
        job.company = company.name;
      });
    }

    await fillJobs(added, batchOpts);

    // Remove any jobs that failed to extract facets
    const filled = added.filter((job) => Object.keys(job.facets).length);

    const failed = added.length - filled.length;
    if (failed) {
      batchLog("Failed", failed, batchOpts);
    }

    if (filled.length) {
      await batchRun(filled, updateJob, "AddJob", batchOpts);
    }
  }
}

async function fillJobs(jobs: Job[], batchOpts: BatchOptions) {
  await batchRun(
    jobs,
    async (job) => {
      await llm.extractLocations(job);
      await llm.extractFacets(job);
    },
    "FillJob",
    batchOpts
  );
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

async function updateJob(job: Job) {
  return db.job.upsert(job);
}

async function deleteJob({ id, companyId }: JobKey) {
  return db.job.deleteItem(id, companyId);
}

// #endregion
