import type {
  Education,
  JobType,
  Office,
  OrgSize,
  PayRate,
  Stage,
  Visa,
} from "./enums";

export type ATS = "greenhouse" | "lever";
type MetadataType = "company" | "companyPrep" | "job" | "jobPrep";

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export interface Company {
  // Keys
  id: string;
  ats: ATS;

  // Basic
  name: string;

  // Extracted Details - Not Indexed
  description?: string;
  website?: string;

  // Extracted Details
  industry?: string;
  foundingYear?: number;
  stage?: Stage;
  size?: OrgSize;
  visa?: Visa;
}

export type CompanyKey = Pick<Company, "id" | "ats">;

export interface CompanyKeys {
  ids: Company["id"][];
  ats: Company["ats"];
}

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface Job {
  // Keys
  id: string;
  companyId: string;

  // Basic
  title: string;
  postTS: number;

  // Basic - Not Indexed
  applyUrl: string;
  description: string;

  // Normalized from extracted details
  location: string;

  // Extracted Details
  locations: {
    remote?: Office;
    city?: string;
    state?: string;
    stateCode?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
  }[];
  compensation: {
    rate?: PayRate;
    min?: number;
    max?: number;
    currency?: string;
    hasEquity?: boolean;
    pto?: number | "Unlimited";
  };
  role: {
    education?: Education;
    experience?: number;
    function?: string;
    type?: JobType;
    skills?: string[];
    travelRequired?: boolean;
    manager?: boolean;
  };
  summary: {
    role?: string;
    impact?: string;
    growth?: string;
  };
}

export type JobKey = Pick<Job, "id" | "companyId">;

/**
 * Aggregated metadata for other containers. Cached in the backend service.
 * - id: The type of metadata
 * - pKey: id
 * Only indexed for point reads.
 */
export interface Metadata {
  // Keys
  id: MetadataType;

  // For company type
  company?: {
    count: number;
    names: [string, string][];
    industry: Record<string, number>;
    stage: Record<string, number>;
    size: Record<string, number>;
  };

  // For job type
  job?: {
    count: number;
    // Added last refresh
    company: Record<string, number>;
    remote: Record<string, number>;
    country: Record<string, number>;
    function: Record<string, number>;
    type: Record<string, number>;
  };
}
