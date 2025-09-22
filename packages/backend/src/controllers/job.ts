import { batch } from "dry-utils-async";
import { Query } from "dry-utils-cosmosdb";
import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { Filters } from "../models/clientModels.ts";
import type { CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Location } from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";
import { normalizedLocation } from "../utils/location.ts";
import { logProperty } from "../utils/telemetry.ts";
import { metadataJobExecutor } from "./metadata.ts";

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

  // Convert filter inputs to Location object
  let location: Location | undefined = undefined;
  const { location: inputLocation, isRemote } = filterInput;
  if (inputLocation || isRemote != undefined) {
    location = { location: inputLocation };
    if (isRemote != undefined) {
      location.remote = isRemote ? "Remote" : "Onsite";
    }
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
    await batch("DeleteJob", remove, (id) =>
      db.job.remove({ id, companyId: key.id })
    );
  }

  if (add.length) {
    // To keep things the same for the client until we update data model
    const company = await db.company.get(key);
    if (company?.name) {
      add.forEach((job) => {
        job.item.companyName = company.name;
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
}: EnhancedFilters) {
  // When adding WHERE clauses to the QueryBuilder, order them for the best performance.
  // Look at the QueryBuilder class comment for ordering guidelines
  const query = new Query();

  if (companyId) {
    query.whereCondition("companyId", "=", companyId);
  }

  const isRemote =
    location?.remote == null ? undefined : location.remote === "Remote";

  if (isRemote !== undefined) {
    query.whereCondition("isRemote", "=", isRemote);
  }

  if (daysSince) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const sinceTS = Date.now() - daysSince * millisecondsPerDay;
    query.whereCondition("postTS", ">=", sinceTS);
  }

  if (maxExperience != null) {
    query.whereCondition("facets.experience", "<=", maxExperience);
  }

  if (minSalary) {
    query.whereCondition("facets.salary", ">=", minSalary);
  }

  if (title) {
    query.whereCondition("title", "CONTAINS", title);
  }

  if (location) {
    const normalLocation = normalizedLocation(location);
    if (location?.countryCode) {
      addLocationClause(query, normalLocation, isRemote);
    } else if (location.location) {
      // Remote + empty location always matches
      query.where([
        '(c.isRemote = true AND c.location = "") OR CONTAINS(c.location, @location, true)',
        { "@location": location.location },
      ]);
    }
  }

  // The limit of 24 items is intentional to prevent excessive data retrieval.
  return db.job.query<Job>(query.build(24));
}

function addLocationClause(query: Query, location: string, isRemote?: boolean) {
  const country = location.split(",").at(-1)?.trim() ?? location;
  const hybridParam = { "@location": location };
  const hybridClause = "ENDSWITH(c.location, @location, true)";
  // Remote + empty location always matches
  const remoteParam = { "@country": country };
  const remoteClause =
    'ENDSWITH(c.location, @country, true) OR c.location = ""';

  if (isRemote) {
    query.where([remoteClause, remoteParam]);
  } else if (isRemote === false) {
    query.where([hybridClause, hybridParam]);
  } else {
    query.where([
      `${hybridClause} OR (c.isRemote = true AND (${remoteClause}))`,
      {
        ...hybridParam,
        ...remoteParam,
      },
    ]);
  }
}

// #endregion
