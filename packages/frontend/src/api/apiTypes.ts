import type { JobFamily, WorkTimeBasis } from "./apiEnums";

export interface MetadataModelApi {
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  timestamp: number;
}

export interface JobModelApi {
  id: string;
  companyId: string;
  company: string;
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;
  isRemote: boolean;
  workTimeBasis: string;
  jobFamily: string;
  location: string;
  facets?: {
    summary?: string;
    salary?: number;
    experience?: number;
  };
}

export interface FilterModelApi {
  // Exact Match
  companyId?: string;
  jobId?: string;
  isRemote?: boolean;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
}
