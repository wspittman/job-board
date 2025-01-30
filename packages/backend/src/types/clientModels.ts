import type { CompanyKey, Job, Metadata } from "./dbModels";

export interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
}

export interface RefreshJobsOptions {
  // To narrow the refresh
  ats?: CompanyKey["ats"];
  companyId?: CompanyKey["id"];
  // To do a full replace of existing jobs, matching the refresh, whose refresh timestamp is older than this
  replaceJobsOlderThan?: number;
}

export type ClientJob = Job;

export type ClientMetadata = Pick<
  Metadata,
  "companyCount" | "companyNames" | "jobCount"
> & { timestamp: number };
