import type {
  Currency,
  JobFamily,
  PayCadence,
  WorkTimeBasis,
} from "./apiEnums";

export interface MetadataModelApi {
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  timestamp: number;
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

  // The Compensation
  currency?: Currency;
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
}

export interface FilterModelApi {
  // Exact Match
  companyId?: string;
  jobId?: string;
  isRemote?: boolean;
  workTimeBasis?: WorkTimeBasis;
  jobFamily?: JobFamily;
  payCadence?: PayCadence;
  currency?: Currency;
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
}
