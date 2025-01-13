import type { Company, Job } from "../types/dbModels";

export interface JobUpdates {
  added: Job[];
  removed: string[];
  kept: number;
}

export interface AtsEndpoint {
  getCompanyEndpoint(id: string): string;
  getJobsEndpoint(id: string): string;
  formatCompany(id: string, company: unknown): Company;
  getRawJobs(data: unknown): [id: string, job: unknown][];
  formatJobs(company: Company, jobs: unknown[]): Job[];
}
