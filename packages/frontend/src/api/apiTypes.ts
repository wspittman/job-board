import type {
  CompanyStage,
  JobFamily,
  PayCadence,
  Presence,
  UsState,
  WorkTimeBasis,
} from "./apiEnums";

export interface MetadataModelApi {
  timestamp: number;
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  recentJobCount: number;
  presenceCounts: Partial<Record<Presence, number>>;
  jobFamilyCounts: Partial<Record<JobFamily, number>>;
}

export interface JobModelApi {
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
  payCadence?: PayCadence;
  minSalary?: number;

  // Other
  description: string;
  postTS: number;
  applyUrl: string;
  isRemote: boolean;
  location: string;
  facets?: {
    summary?: string;
    experience?: number;
  };

  companyWebsite?: string;
}

export interface FilterModelApi {
  // Exact Match
  companyId?: string;
  jobId?: string;
  isRemote?: boolean;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;
  companyStage?: CompanyStage;
  payCadence?: PayCadence;
  state?: UsState;
  // Substring Match
  title?: string;
  city?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
  // Admin
  refresh?: boolean;
}
