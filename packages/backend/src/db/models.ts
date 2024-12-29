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
 * Metadata for the database. Refreshed after Crawl and cached in the backend service.
 * - id: "metadata"
 * - pKey: id
 */
export interface Metadata {
  id: "metadata";
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
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
