import { queryFilters, upsert } from "./db";

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
  atsId: string;
}

export async function addJob(job: Job) {
  upsert("job", job);
}

export async function getJobs(company: string) {
  return queryFilters<Job>("job", { company });
}
