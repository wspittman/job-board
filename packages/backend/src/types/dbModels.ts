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
  size?: OrgSize;
  stage?: Stage;
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
  rev: number;

  // Basic - Not Indexed
  applyUrl: string;
  description: string;

  // Extracted Details Below

  // Location - most only have one, but some have multiple
  // Split into multiple fields for query efficiency
  location?: Location;
  locationList?: Location[];
  locationHasMultiple?: boolean;

  // History - most only have one, but some have multiple
  // Split into multiple fields for query efficiency
  history?: History;
  historyList?: History[];
  historyHasMultiple?: boolean;

  role?: {
    function?: string;
    type?: JobType;
    skills?: string[];
    travelRequired?: boolean;
    manager?: boolean;
  };
  compensation?: {
    rate?: PayRate;
    min?: number;
    max?: number;
    currency?: string;
    hasEquity?: boolean;
    pto?: number | "Unlimited";
  };
  summary?: {
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
  id: "company" | "job" | "metadata";

  // For company type
  companyCount?: number;
  companyNames?: [string, string][];

  // For job type
  jobCount?: number;
}

/**
 * A cache of freehand location string -> normalized location
 * - id: The freehand location string
 * - pKey: The first character of the freehand location string
 */
export interface LocationCache extends Location {
  id: string;
  pKey: string;
}

export interface Location {
  // Normalized from the rest of the fields
  location?: string;
  remote?: Office;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}

interface History {
  education?: Education;
  experience?: number;
}
