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

export async function addJob(job: Job) {
  upsert("job", job);
}

export async function getJobs(companyId: string) {
  return queryByFilters<Job>("job", { companyId });
}

export async function getJobIds(companyId: string) {
  return getAllIdsByPartitionKey("job", companyId);
}

export async function deleteJob(id: string, companyId: string) {
  return deleteItem("job", id, companyId);
}
