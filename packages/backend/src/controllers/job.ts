import { getAts, getAtsList } from "../ats/ats";
import {
  deleteItem,
  getAllIdsByPartitionKey,
  queryByFilters,
  upsert,
} from "../db/db";
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
}

interface CrawlOptions {
  company?: CompanyKey;
}

function validateFilters({
  companyId,
  isRemote,
  title,
  location,
}: Record<string, string>): Filters {
  const filters: Filters = {};

  if (companyId) {
    filters.companyId = companyId;
  }

  if (isRemote) {
    filters.isRemote = isRemote === "true";
  }

  if (title) {
    filters.title = title;
  }

  if (location) {
    filters.location = location;
  }

  return filters;
}

function validateCrawlOptions({ company }: CrawlOptions): CrawlOptions {
  if (company) {
    company = validateCompanyKey("getJobs", company);
  }

  return { company };
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

async function crawlAts(ats: ATS) {
  return logWrap(`crawlAts(${ats})`, async () => {
    const companies = await getCompanies(ats);
    await batchRun(companies, (company) => crawlCompany(company));
  });
}

async function crawlCompany(company: Company) {
  const msg = `crawlCompany(${company.ats}, ${company.id})`;
  return logWrap(msg, async () => {
    const jobs = await getAts(company.ats).getJobs(company);
    const jobIdSet = new Set(jobs.map((job) => job.id));
    const dbJobIds = await readJobIds(company.id);
    const dbJobIdSet = new Set(dbJobIds);

    // If the ATS job is not in the DB, add it
    const toAdd = jobs.filter((job) => !dbJobIdSet.has(job.id));
    console.log(`${msg}: Adding ${toAdd.length} jobs`);
    await batchRun(toAdd, (job) => updateJob(job));

    // If the DB job is not in the ATS, delete it
    const toDelete = dbJobIds.filter((id) => !jobIdSet.has(id));
    console.log(`${msg}: Deleting ${toDelete.length} jobs`);
    await batchRun(toDelete, (id) => deleteJob({ id, companyId: company.id }));

    // If job is in both ATS and DB, do nothing
    console.log(`${msg}: Ignoring ${jobIdSet.size - toAdd.length} jobs`);
  });
}

// #region DB Operations

async function readJobsByFilters({
  companyId,
  isRemote,
  title,
  location,
}: Filters) {
  return queryByFilters<Job>(
    container,
    { companyId, isRemote },
    { title, location }
  );
}

async function readJobIds(companyId: string) {
  return getAllIdsByPartitionKey(container, companyId);
}

async function updateJob(job: Job) {
  upsert(container, job);
}

async function deleteJob({ id, companyId }: JobKey) {
  return deleteItem(container, id, companyId);
}

// #endregion
