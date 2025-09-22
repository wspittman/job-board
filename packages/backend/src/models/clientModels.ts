import type { CompanyKey } from "./models.ts";

// #region Input Models

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

// #endregion

// #region Output Models

/**
 * Prior to the DB model changes, these were equivalent to the DB models.
 * Now, they are set to what the DB models _used to be_.
 * This is to avoid changing the client models in the frontend for now.
 */

export interface ClientJob {
  id: string;
  companyId: string;
  company: string;
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;
  isRemote: boolean;
  location: string;
  facets: {
    summary?: string;
    salary?: number;
    experience?: number;
  };
}

export interface ClientMetadata {
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  timestamp: number;
}

// #endregion
