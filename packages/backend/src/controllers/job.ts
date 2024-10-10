import { crawl } from "../crawler";
import {
  deleteItem,
  getAllIdsByPartitionKey,
  queryByFilters,
  upsert,
} from "../db/db";
import type { Job } from "../db/models";
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

export async function getJobs(filterInput: Record<string, string>) {
  const filters = validateFilters(filterInput);

  if (!Object.keys(filters).length) {
    return [];
  }

  return await getJobsByFilters(filters);
}

export async function crawlJobs() {
  await crawl();
  await renewMetadata();
}

export async function addJob(job: Job) {
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
