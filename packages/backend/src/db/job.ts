import { getContainer, queryFilters, upsert } from "./db";

/**
 * - id: DB-generated
 * - pKey: company
 */
export interface Job {
  company: string;
  title: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

export async function addJob(job: Job) {
  upsert(getContainer("job"), job);
}

export async function getJobs(company: string) {
  return queryFilters<Job>(getContainer("job"), { company });
}
