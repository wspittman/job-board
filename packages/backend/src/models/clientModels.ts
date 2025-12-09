import type { JobFamily, PayCadence, WorkTimeBasis } from "./enums.ts";
import type { CompanyKey } from "./models.ts";

// #region Input Models

export interface Filters {
  // Exact Match
  companyId?: string;
  jobId?: string;
  isRemote?: boolean;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;
  payCadence?: PayCadence;
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
 * This is shaped by the legacy DB models, to avoid changing the frontend too much too fast.
 * They are gradually being updated.
 */

export interface ClientJob {
  // Keys
  id: string;
  companyId: string;

  // The Work
  title: string;
  company: string;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;

  // The Compensation
  payCadence?: PayCadence;
  minSalary?: number;

  // Other
  description: string;
  postTS: number;
  applyUrl: string;
  isRemote: boolean;
  location: string;
  facets: {
    summary?: string;
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
