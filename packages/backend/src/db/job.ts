import {
  deleteItem,
  getAllIdsByPartitionKey,
  queryByFilters,
  upsert,
} from "./db";

/**
 * - id: The ATS-granted job id
 * - pKey: company
 */
export interface Job {
  id: string;
  company: string;
  title: string;
  isRemote: boolean;
  // Just freetext for now
  location: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

export async function addJob(job: Job) {
  upsert("job", job);
}

export async function getJobs(company: string) {
  return queryByFilters<Job>("job", { company });
}

export async function getJobIds(company: string) {
  return getAllIdsByPartitionKey("job", company);
}

export async function deleteJob(id: string, company: string) {
  return deleteItem("job", id, company);
}
