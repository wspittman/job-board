import { Resource, SqlParameter } from "@azure/cosmos";
import { extractFacets } from "../ai/extractFacets";
import { extractLocations } from "../ai/extractLocation";
import { AppError } from "../AppError";
import { getAtsJobs, getAtsList } from "../ats/ats";
import { db } from "../db/db";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../db/models";
import { validateCompanyKey, validateJobKey } from "../db/validation";
import { batchLog, BatchOptions, batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { ClientJob } from "./clientModels";
import { getCompanies, getCompany } from "./company";
import { renewMetadata } from "./metadata";

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

interface CrawlOptions {
  company?: CompanyKey;
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
  const filters = validateFilters(filterInput);
  logProperty("GetJobs_Filters", filters);

  if (!Object.keys(filters).length) {
    return [];
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
    await batchRun(getAtsList(), crawlAts, "CrawlAts");
  }

  await renewMetadata();
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

async function crawlAts(ats: ATS, logPath: string[]) {
  const companies = await getCompanies(ats);
  await batchRun(companies, crawlCompany, "CrawlCompany", {
    batchId: ats,
    logPath,
  });
}

async function crawlCompany(company: Company, logPath: string[] = []) {
  const batchOpts = { batchId: company.id, logPath };
  const dbJobIds = await readJobIds(company.id);
  const { added, removed, kept } = await getAtsJobs(company, dbJobIds);

  if (added.length) {
    await fillJobs(added, batchOpts);
    await batchRun(added, updateJob, "AddJob", batchOpts);
  }

  if (removed.length) {
    await batchRun(
      removed,
      (id) => deleteJob({ id, companyId: company.id }),
      "DeleteJob",
      batchOpts
    );
  }

  batchLog("Ignored", kept, batchOpts);
}

async function fillJobs(jobs: Job[], batchOpts: BatchOptions) {
  const locations = await extractLocations(
    jobs.map((job) => job.location),
    batchOpts
  );
  const facets = await extractFacets(
    jobs.map((job) => job.description),
    batchOpts
  );

  jobs.forEach((job, index) => {
    job.isRemote = locations[index]?.isRemote ?? job.isRemote;
    job.location = locations[index]?.location ?? job.location;
    job.facets = facets[index] ?? {};
  });
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
}: Filters) {
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

  if (location) {
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

async function readJobIds(companyId: string) {
  return db.job.getAllIdsByPartitionKey(companyId);
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
