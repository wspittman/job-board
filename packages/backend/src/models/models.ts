import type { DeepPartialNullToUndef } from "../types/types.ts";
import type {
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
} from "./extractionModels.ts";

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

export interface Company
  extends CompanyKey, DeepPartialNullToUndef<ExtractionCompany> {
  name: string;
  ignoreJobIds?: string[];
}

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export interface JobKey {
  id: string;
  companyId: string;
}

export interface Job extends JobKey, DeepPartialNullToUndef<ExtractionJob> {
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;

  // Denormalized from Company to reduce joins
  companyName: Company["name"];
  companyStage?: Company["stage"];
  companySize?: Company["size"];

  // For simplified location searches
  locationSearchKey?: string;
}

/**
 * Aggregated metadata for other containers. Cached in the backend service.
 * - id: The type of metadata
 * - pKey: id
 * Only indexed for point reads.
 */
export interface Metadata {
  // Keys
  id: "company" | "job";

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
export interface Location extends DeepPartialNullToUndef<ExtractionLocation> {
  id?: string;
  pKey?: string;
}
