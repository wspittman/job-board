import type {
  CompanyStage,
  JobFamily,
  PayCadence,
  Presence,
  UsState,
  WorkTimeBasis,
} from "./enums.ts";
import type { CompanyKey, SalaryStat } from "./models.ts";

// #region Input Models

export interface Filters {
  // Exact Match
  companyId?: string;
  jobId?: string;
  isRemote?: boolean;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;
  companyStage?: CompanyStage;
  payCadence?: PayCadence;
  currency?: string;
  // Substring Match
  title?: string;
  city?: string;
  state?: UsState;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
  // Admin
  refresh?: boolean;
}

export interface RefreshJobsOptions {
  // To narrow the refresh
  ats?: CompanyKey["ats"];
  companyIds?: CompanyKey["id"][];
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
  companyStage?: CompanyStage;

  // The Compensation
  currency?: string;
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

  companyWebsite?: string;
}

export interface ClientMetadata {
  timestamp: number;
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  recentJobCount: number;
  presenceCounts: Partial<Record<Presence, number>>;
  jobFamilyCounts: Partial<Record<JobFamily, number>>;
  workTimeCounts: Partial<Record<WorkTimeBasis, number>>;
  stageCounts: Partial<Record<CompanyStage, number>>;
  topLocations: { regionCode: string; count: number }[];
  salaryStats: SalaryStat[];
}

// #endregion
