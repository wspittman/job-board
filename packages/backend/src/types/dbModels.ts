export type ATS = "greenhouse" | "lever";

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export interface Company {
  id: string;
  ats: ATS;
  name: string;
  description: string;
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
export interface LocationCache {
  id: string;
  pKey: string;
  isRemote: boolean;
  location: string;
}
