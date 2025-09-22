import type {
  InferredCompany,
  InferredJob,
  InferredLocation,
} from "./inferredModels.ts";

export type ATS = "greenhouse" | "lever";

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export interface CompanyKey {
  id: string;
  ats: ATS;
}

export interface CompanyKeys {
  ids: CompanyKey["id"][];
  ats: CompanyKey["ats"];
}

export type Company = CompanyKey &
  Partial<InferredCompany> & {
    name: string;
  };

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface JobKey {
  id: string;
  companyId: string;
}

export type Job = JobKey &
  Partial<InferredJob> & {
    title: string;
    description: string;
    postTS: number;
    applyUrl: string;

    // Denormalized from Company to reduce joins
    companyName: Company["name"];
    // TBD
    //companyStage?: Company["stage"];
    //companySize?: Company["size"];
  };

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
export interface LocationCache extends Partial<InferredLocation> {
  id: string;
  pKey: string;
}

export type Location = Partial<InferredLocation>;
