import { SqlParameter } from "@azure/cosmos";
import { extractFacets } from "../ai/extractFacets";
import { extractLocations } from "../ai/extractLocation";
import { AppError } from "../AppError";
import { getAts, getAtsList } from "../ats/ats";
import { deleteItem, getAllIdsByPartitionKey, query, upsert } from "../db/db";
import type { ATS, Company, CompanyKey, Job, JobKey } from "../db/models";
import { validateCompanyKey, validateJobKey } from "../db/validation";
import { batchRun, logWrap } from "../utils/async";
import { getCompanies, getCompany } from "./company";
import { renewMetadata } from "./metadata";

const container = "job";

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

  if (companyId) {
    filters.companyId = companyId;
  }

  if (isRemote != null) {
    filters.isRemote = isRemote.toLowerCase() === "true";
  }

  if (title?.length > 2) {
    filters.title = title;
  }

  if (location?.length > 2) {
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

function validateCrawlOptions({ company }: CrawlOptions): CrawlOptions {
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

export async function getJobs(filterInput: Record<string, string>) {
  const filters = validateFilters(filterInput);

  if (!Object.keys(filters).length) {
    return [];
  }

  return readJobsByFilters(filters);
}

export async function addJobs(options: CrawlOptions) {
  const { company: companyKey } = validateCrawlOptions(options);

  if (companyKey) {
    return logWrap(`addJobs(${companyKey.id})`, async () => {
      const company = await getCompany(companyKey);
      await crawlCompany(company);
      await renewMetadata();
    });
  }

  return logWrap("addJobs", async () => {
    await Promise.all(getAtsList().map(crawlAts));
    await renewMetadata();
  });
}

export async function removeJob(key: JobKey) {
  return deleteJob(validateJobKey("removeJob", key));
}

export async function removeJobs(options: DeleteOptions) {
  const { timestamp } = validateDeleteOptions(options);

  if (!timestamp) {
    throw new AppError("No timestamp provided");
  }

  return logWrap(
    `removeJobs(${new Date(timestamp).toISOString()})`,
    async () => {
      const jobKeys = await readJobKeysByTimestamp(timestamp);
      console.log(`Deleting ${jobKeys.length} jobs`);
      await batchRun(jobKeys, deleteJob);
    }
  );
}

async function crawlAts(ats: ATS) {
  return logWrap(`crawlAts(${ats})`, async () => {
    const companies = await getCompanies(ats);
    await batchRun(companies, (company) => crawlCompany(company));
  });
}

async function crawlCompany(company: Company) {
  const msg = `crawlCompany(${company.ats}, ${company.id})`;
  return logWrap(msg, async () => {
    const dbJobIds = await readJobIds(company.id);
    const { added, removed, kept } = await getAts(company.ats).getJobUpdates(
      company,
      dbJobIds
    );

    console.log(`${msg}: Adding ${added.length} jobs`);
    if (added.length) {
      await fillJobs(added, company);
      await batchRun(added, (job) => updateJob(job));
    }

    console.log(`${msg}: Deleting ${removed.length} jobs`);
    if (removed.length) {
      await batchRun(removed, (id) => deleteJob({ id, companyId: company.id }));
    }

    console.log(`${msg}: Ignoring ${kept} jobs`);
  });
}

async function fillJobs(jobs: Job[], company: Company) {
  const msg = `fillJobs(${jobs.length}, ${company.id})`;
  return logWrap(msg, async () => {
    const locations = await extractLocations(jobs.map((job) => job.location));
    const facets = await extractFacets(jobs.map((job) => job.description));

    jobs.forEach((job, index) => {
      job.isRemote = locations[index]?.isRemote ?? job.isRemote;
      job.location = locations[index]?.location ?? job.location;
      job.facets = facets[index] ?? {};
    });
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

  return query<Job>(container, {
    query: `SELECT TOP 50 * FROM c WHERE ${where} OFFSET 0 LIMIT 50`,
    parameters,
  });
}

async function readJobIds(companyId: string) {
  return getAllIdsByPartitionKey(container, companyId);
}

async function readJobKeysByTimestamp(timestamp: number) {
  return query<JobKey>(container, {
    query: "SELECT TOP 100 c.id, c.companyId FROM c WHERE c._ts <= @timestamp",
    // CosmosDB uses seconds, not milliseconds
    parameters: [{ name: "@timestamp", value: timestamp / 1000 }],
  });
}

async function updateJob(job: Job) {
  upsert(container, job);
}

async function deleteJob({ id, companyId }: JobKey) {
  return deleteItem(container, id, companyId);
}

// #endregion
