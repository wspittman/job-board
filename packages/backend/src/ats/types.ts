import type { Company, Job } from "../db/models";

export interface AtsEndpoint {
  getCompany(id: string): Promise<Company>;
  getJobs(company: Company): Promise<Job[]>;
}
