import { Resource, SqlParameter } from "@azure/cosmos";
import { extractLocation } from "../ai/extractLocation";
import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { ClientJob } from "../types/clientModels";
import type { CompanyKey, Job, JobKey } from "../types/dbModels";
import type { LLMContext } from "../types/types";
import { AppError } from "../utils/AppError";
import { batchRun } from "../utils/async";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";

const jobInfoQueue = new AsyncQueue<{
  companyKey: CompanyKey;
  jobContext: LLMContext<Job>;
}>("refreshJobInfo", refreshJobInfo);

// #region Input Types and Validations

interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
}

interface EnhancedFilters extends Filters {
  normalizedLocation?: string;
}

interface DeleteOptions {
  timestamp?: number;
}

function validateFilters({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
}: Record<string, string>): Filters {
  const filters: Filters = {};

  if (companyId && companyId.length < 100) {
    filters.companyId = companyId;
  }

  if (isRemote != null) {
    filters.isRemote = isRemote.toLowerCase() === "true";
  }

  if (title?.length > 2 && title.length < 100) {
    filters.title = title;
  }

  if (location?.length > 2 && location.length < 100) {
    filters.location = location;
  }

  if (daysSince) {
    const value = parseInt(daysSince);

    if (Number.isFinite(value) && value >= 1 && value <= 365) {
      filters.daysSince = value;
    }
  }

  if (maxExperience != null) {
    const value = parseInt(maxExperience);
    if (Number.isFinite(value) && value >= 0 && value <= 100) {
      filters.maxExperience = value;
    }
  }

  if (minSalary) {
    const value = parseInt(minSalary);
    if (Number.isFinite(value) && value >= 1 && value <= 10000000) {
      filters.minSalary = value;
    }
  }

  return filters;
}

function validateCrawlOptions(options: CrawlOptions): CrawlOptions {
  let { company, ...rest } = options;

  if (Object.keys(rest).length) {
    throw new AppError("Unknown options");
  }

  if (company) {
    company = validateCompanyKey("getJobs", company);
  }

  return { company };
}

function validateDeleteOptions({ timestamp }: DeleteOptions): DeleteOptions {
  if (timestamp) {
    const now = Date.now();
    const minTimestamp = new Date("2024-01-01").getTime();

    if (timestamp > now || timestamp < minTimestamp) {
      throw new AppError("Invalid timestamp");
    }
  }

  return { timestamp };
}

// #endregion

export async function getClientJobs(filterInput: Record<string, string>) {
  const dbResults = await getJobs(filterInput);

  const toClientJob = ({
    id,
    companyId,
    company,
    title,
    description,
    postTS,
    applyUrl,
    isRemote,
    location,
    facets,
  }: Job): ClientJob => {
    return {
      id,
      companyId,
      company,
      title,
      description,
      postTS,
      applyUrl,
      isRemote,
      location,
      facets,
    };
  };

  return dbResults.map(toClientJob);
}

export async function getJobs(filterInput: Record<string, string>) {
  const inputFilters = validateFilters(filterInput);
  logProperty("GetJobs_Filters", inputFilters);

  if (!Object.keys(inputFilters).length) {
    return [];
  }

  let filters: EnhancedFilters = { ...inputFilters };
  if (filters.location) {
    const location = (await extractLocation(filters.location))?.location;
    if (location) {
      filters.normalizedLocation = location;
    }
  }

  const result = await readJobsByFilters(filters);
  logProperty("GetJobs_Count", result.length);
  return result;
}

export async function removeJob(key: JobKey) {
  const jobKey = validateJobKey("removeJob", key);
  logProperty("RemoveJob_Key", jobKey);
  return deleteJob(jobKey);
}

export async function removeJobs(options: DeleteOptions) {
  const { timestamp } = validateDeleteOptions(options);

  if (!timestamp) {
    throw new AppError("No timestamp provided");
  }

  logProperty("RemoveJobs_Timestamp", timestamp);

  const jobKeys = await readJobKeysByTimestamp(timestamp);
  logProperty("RemoveJobs_Count", jobKeys.length);

  await batchRun(jobKeys, deleteJob, "DeleteJob");
}

export async function refreshJobsForCompany(key: CompanyKey) {
  logProperty("Input", key);
  const currentIds = await db.job.getIds(key.id);

  // If no jobs are found, assume newly added company and get full job data
  const getFullJobInfo = !currentIds.length;
  const atsJobs = await ats.getJobs(key, getFullJobInfo);

  // Figure out which jobs are added/removed/ignored
  const jobIdSet = new Set(atsJobs.map(({ item }) => item.id));
  const currentIdSet = new Set(currentIds);

  // Any ATS job not in the current set needs to be added
  const added = atsJobs.filter(({ item }) => !currentIdSet.has(item.id));

  // Any jobs in the current set but not in the ATS need to be deleted
  const removed = currentIds.filter((id) => !jobIdSet.has(id));

  // If job is in both ATS and DB, do nothing but keep a count
  const existing = jobIdSet.size - added.length;
  logProperty("Ignored", existing);

  if (
    added.length &&
    !atsJobs[0].context &&
    9 * added.length > removed.length + existing
  ) {
    await ats.getJobs(key, true);
    // Where to stuff this data?
  }

  if (removed.length) {
    await batchRun(
      removed,
      (id) => db.job.remove({ id, companyId: key.id }),
      "DeleteJob"
    );
    // TODO: How to update the metadata object?
  }

  if (added.length) {
    jobInfoQueue.addMany(
      added.map((add) => ({ companyKey: key, jobContext: add }))
    );
  }
}

async function refreshJobInfo({
  companyKey,
  jobContext,
}: {
  companyKey: CompanyKey;
  jobContext: LLMContext<Job>;
}) {
  logProperty("Input", { ...companyKey, jobId: jobContext.item.id });
  if (!jobContext.context) {
    jobContext = await ats.getJob(companyKey, jobContext.item);
  }

  // TODO: Remove job on external failures

  await llm.extractJobInfo(jobContext);
  await db.job.upsert(jobContext.item);

  //TODO: Update job metadata object
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

  const whereClauses: string[] = [];
  const parameters: SqlParameter[] = [];

  if (companyId) {
    whereClauses.push("c.companyId = @companyId");
    parameters.push({ name: "@companyId", value: companyId });
  }

  if (isRemote !== undefined) {
    whereClauses.push("c.isRemote = @isRemote");
    parameters.push({ name: "@isRemote", value: isRemote });
  }

  if (daysSince) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const sinceTS = Date.now() - daysSince * millisecondsPerDay;
    whereClauses.push("c.postTS >= @sinceTS");
    parameters.push({ name: "@sinceTS", value: sinceTS });
  }

  if (maxExperience != null) {
    // If undefined: include, since we can't yet distinguish between entry level and absent
    whereClauses.push(
      "(NOT IS_DEFINED(c.facets.experience) OR c.facets.experience <= @maxExperience)"
    );
    parameters.push({ name: "@maxExperience", value: maxExperience });
  }

  if (minSalary) {
    // If undefined: exclude
    whereClauses.push("c.facets.salary >= @minSalary");
    parameters.push({ name: "@minSalary", value: minSalary });
  }

  if (title) {
    whereClauses.push("CONTAINS(LOWER(c.title), @title)");
    parameters.push({ name: "@title", value: title.toLowerCase() });
  }

  if (normalizedLocation) {
    addLocationClause(whereClauses, parameters, normalizedLocation, isRemote);
  } else if (location) {
    // Remote + empty location always matches
    whereClauses.push(
      '((c.isRemote = true AND c.location = "") OR CONTAINS(LOWER(c.location), @location))'
    );
    parameters.push({ name: "@location", value: location.toLowerCase() });
  }

  const where = whereClauses.join(" AND ");

  return db.job.query<Job & Resource>({
    query: `SELECT TOP 24 * FROM c WHERE ${where}`,
    parameters,
  });
}

function addLocationClause(
  whereClauses: string[],
  parameters: SqlParameter[],
  location: string,
  isRemote?: boolean
) {
  location = location.toLowerCase();
  const country = location.split(",").at(-1)?.trim() ?? location;
  const hybridParam = { name: "@location", value: location };
  const hybridClause = "ENDSWITH(LOWER(c.location), @location)";
  // Remote + empty location always matches
  const remoteParam = { name: "@country", value: country };
  const remoteClause =
    '(ENDSWITH(LOWER(c.location), @country) OR c.location = "")';

  if (isRemote) {
    whereClauses.push(remoteClause);
    parameters.push(remoteParam);
  } else if (isRemote === false) {
    whereClauses.push(hybridClause);
    parameters.push(hybridParam);
  } else {
    whereClauses.push(
      `(${hybridClause} OR (c.isRemote = true AND ${remoteClause}))`
    );
    parameters.push(hybridParam);
    parameters.push(remoteParam);
  }
}

async function readJobKeysByTimestamp(timestamp: number) {
  return db.job.query<JobKey>({
    query: "SELECT TOP 100 c.id, c.companyId FROM c WHERE c._ts <= @timestamp",
    // CosmosDB uses seconds, not milliseconds
    parameters: [{ name: "@timestamp", value: timestamp / 1000 }],
  });
}

// #endregion
