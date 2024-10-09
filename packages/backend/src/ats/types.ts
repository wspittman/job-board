import type { Company } from "../controllers/company";
import type { Job } from "../controllers/job";

export enum ATS {
  GREENHOUSE = "greenhouse",
  LEVER = "lever",
}

export interface AtsEndpoint {
  getCompany(id: string): Promise<Company>;
  getJobs(company: Company): Promise<Job[]>;
}
