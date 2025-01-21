import type { Job, Metadata } from "./dbModels";

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

export type ClientJob = Job;

export type ClientMetadata = Pick<
  Metadata,
  "companyCount" | "companyNames" | "jobCount"
> & { timestamp: number };
