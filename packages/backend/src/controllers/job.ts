import { getAts, getAtsList } from "../ats/ats";
import {
  deleteItem,
  getAllIdsByPartitionKey,
  queryByFilters,
  upsert,
} from "../db/db";
import type { ATS, Company, Job } from "../db/models";
import { batchRun, logWrap } from "../utils/async";
import { getCompanies } from "./company";
import { renewMetadata } from "./metadata";

export interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
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

export async function createJobs() {
  return logWrap("Job.createJobs", async () => {
    await Promise.all(getAtsList().map(crawlAts));
    await renewMetadata();
  });
}

export async function getJobs(filterInput: Record<string, string>) {
  const filters = validateFilters(filterInput);

  if (!Object.keys(filters).length) {
    return [];
  }

  return await getJobsByFilters(filters);
}

async function crawlAts(ats: ATS) {
  return logWrap(`Job.crawlAts(${ats})`, async () => {
    const companies = await getCompanies(ats);
    await batchRun(companies, (company) => crawlCompany(company));
  });
}

async function crawlCompany(company: Company) {
  const msg = `CrawlCompany(${company.ats}, ${company.id})`;
  return logWrap(msg, async () => {
    const jobs = await getAts(company.ats).getJobs(company);
    const jobIdSet = new Set(jobs.map((job) => job.id));
    const dbJobIds = await getJobIds(company.id);
    const dbJobIdSet = new Set(dbJobIds);

    // If the ATS job is not in the DB, add it
    const toAdd = jobs.filter((job) => !dbJobIdSet.has(job.id));
    console.log(`${msg}: Adding ${toAdd.length} jobs`);
    await batchRun(toAdd, (job) => addJob(job));

    // If the DB job is not in the ATS, delete it
    const toDelete = dbJobIds.filter((id) => !jobIdSet.has(id));
    console.log(`${msg}: Deleting ${toDelete.length} jobs`);
    await batchRun(toDelete, (id) => deleteJob(id, company.id));

    // If job is in both ATS and DB, do nothing
    console.log(`${msg}: Ignoring ${jobIdSet.size - toAdd.length} jobs`);
  });
}

async function addJob(job: Job) {
  upsert("job", job);
}

async function getJobsByFilters({
  companyId,
  isRemote,
  title,
  location,
}: Filters) {
  return queryByFilters<Job>(
    "job",
    { companyId, isRemote },
    { title, location }
  );
}

export async function getJobIds(companyId: string) {
  return getAllIdsByPartitionKey("job", companyId);
}

export async function deleteJob(id: string, companyId: string) {
  return deleteItem("job", id, companyId);
}
