import type { Office, OrgSize, Stage, Visa } from "./enums";

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
  id: string;
  companyId: string;
  company: string;
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;
  // Extracted values with fallbacks
  isRemote: boolean;
  location: string;
  // Facets extracted from the job description
  facets: {
    summary?: string;
    salary?: number;
    experience?: number;
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
