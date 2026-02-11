import { z } from "dry-utils-openai";
import type { DeepPartialNullToUndef } from "../types/types.ts";
import type {
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
} from "./extractionModels.ts";

export const IdSchema = z.string().trim().nonempty().max(100);
export const AtsSchema = z.enum(["greenhouse", "lever"] as const);
export type ATS = z.infer<typeof AtsSchema>;

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export const CompanyKeySchema = z.object({ id: IdSchema, ats: AtsSchema });
export type CompanyKey = z.infer<typeof CompanyKeySchema>;

export const CompanyKeysSchema = z.object({
  ids: z.array(IdSchema).nonempty().max(50),
  ats: AtsSchema,
});
export type CompanyKeys = z.infer<typeof CompanyKeysSchema>;

export interface Company
  extends CompanyKey, DeepPartialNullToUndef<ExtractionCompany> {
  name: string;
  ignoreJobIds?: string[];
}

/**
 * - id: The ATS-granted job id
 * - pKey: companyId
 */
export const JobKeySchema = z.object({ id: IdSchema, companyId: IdSchema });
export type JobKey = z.infer<typeof JobKeySchema>;

export const FullJobKeySchema = z.object({
  companyId: IdSchema,
  jobId: IdSchema,
  ats: AtsSchema,
});
// Not inferred -> this get split on validation into separate company and job keys
export type FullJobKey = { jobKey: JobKey; companyKey: CompanyKey };

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
