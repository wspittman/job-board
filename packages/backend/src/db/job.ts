import { Request } from "express";
import {
  deleteItem,
  getAllIdsByPartitionKey,
  queryByFilters,
  upsert,
} from "./db";

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface Job {
  id: string;
  companyId: string;
  company: string;
  title: string;
  isRemote: boolean;
  // Just freetext for now
  location: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

export interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
}

function queryToDict(query: Request["query"]) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length) {
      result[key] = value;
    }
  }

  return result;
}

export function validateFilters(query: Request["query"]): Filters {
  const filters: Filters = {};

  const { companyId, isRemote, title, location } = queryToDict(query);

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

export async function addJob(job: Job) {
  upsert("job", job);
}

export async function getJobs({
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
