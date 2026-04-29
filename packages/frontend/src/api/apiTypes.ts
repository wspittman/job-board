import type {
  CompanyStage,
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
  companyStage?: CompanyStage;

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
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
  // Admin
  refresh?: boolean;
}

export interface CompanyKeyApi {
  id: string;
  ats: "greenhouse" | "lever";
}
