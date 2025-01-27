import { Resource, SqlParameter } from "@azure/cosmos";
import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { ClientJob, Filters } from "../types/clientModels";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { batchLog, BatchOptions, batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { getCompanies, getCompany } from "./company";
import { renewMetadata } from "./metadata";

// #region Input Types and Validations

interface EnhancedFilters extends Filters {
  normalizedLocation?: string;
}

interface CrawlOptions {
  company?: CompanyKey;
}

interface DeleteOptions {
  timestamp?: number;
}

function validateCrawlOptions(options: CrawlOptions): CrawlOptions {
  let { company, ...rest } = options;

  if (Object.keys(rest).length) {
    throw new AppError("Unknown options");
  }

  if (company) {
    // Ignore for now: incoming crawl overhaul
    // company = validateCompanyKey("getJobs", company);
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

export async function getClientJobs(filterInput: Filters) {
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

export async function addJobs(options: CrawlOptions) {
  const { company: companyKey } = validateCrawlOptions(options);

  if (companyKey) {
    const company = await getCompany(companyKey);
    if (!company) return;
    await crawlCompany(company);
  } else {
    await batchRun(ats.getAtsList(), crawlAts, "CrawlAts");
  }

  await renewMetadata();
}

export async function removeJob(key: JobKey) {
  return deleteJob(key);
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

async function crawlAts(ats: ATS, logPath: string[]) {
  const companies = await getCompanies(ats);
  await batchRun(companies, crawlCompany, "CrawlCompany", {
    batchId: ats,
    logPath,
  });
}

async function crawlCompany(company: Company, logPath: string[] = []) {
  const batchOpts = { batchId: company.id, logPath };
  const currentIds = await readJobIds(company.id);
  const atsJobs = await ats.getJobs(company, true);

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
      (id) => deleteJob({ id, companyId: company.id }),
      "DeleteJob",
      batchOpts
    );
  }

  if (added.length) {
    // To keep things the same for the client until we update data model
    added.forEach((job) => {
      job.company = company.name;
    });

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

async function readJobIds(companyId: string) {
  return db.job.getIdsByPartitionKey(companyId);
}

async function readJobKeysByTimestamp(timestamp: number) {
  return db.job.query<JobKey>({
    query: "SELECT TOP 100 c.id, c.companyId FROM c WHERE c._ts <= @timestamp",
    // CosmosDB uses seconds, not milliseconds
    parameters: [{ name: "@timestamp", value: timestamp / 1000 }],
  });
}

async function updateJob(job: Job) {
  return db.job.upsert(job);
}

async function deleteJob({ id, companyId }: JobKey) {
  return db.job.deleteItem(id, companyId);
}

// #endregion
