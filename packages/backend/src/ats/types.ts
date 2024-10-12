import type { Company, Job } from "../db/models";

export interface JobUpdates {
  added: Job[];
  removed: string[];
  kept: number;
}

export interface AtsEndpoint {
  getCompany(id: string): Promise<Company>;
  getJobUpdates(company: Company, currentIds: string[]): Promise<JobUpdates>;
}
