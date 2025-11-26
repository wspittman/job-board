import type { WorkTimeBasis } from "./apiEnums";

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
  // Extracted values with fallbacks
  isRemote: boolean;
  workTimeBasis: string;
  location: string;
  // Facets extracted from the job description
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
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
}
