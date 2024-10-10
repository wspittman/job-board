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

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface Job {
  id: string;
  companyId: string;
  company: string;
  title: string;
  isRemote: boolean;
  // Just freetext for now
  location: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

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
