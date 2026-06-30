import { z } from "dry-utils-openai";
import type { DeepPartialNullToUndef } from "../types/types.ts";
import type { JobFamily, Presence } from "./enums.ts";
import type {
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
} from "./extractionModels.ts";

export const IdSchema = z.string().trim().nonempty().max(100);
export const AtsSchema = z.enum(["ashby", "greenhouse", "lever"] as const);
export type ATS = z.infer<typeof AtsSchema>;
export type CompanyQuickRef = [id: string, name: string, website?: string];

// #region Keys

export const CompanyKeySchema = z.object({ id: IdSchema, ats: AtsSchema });
/**
 * - id: The companyId (ATS slug)
 * - pKey: ats
 */
export type CompanyKey = z.infer<typeof CompanyKeySchema>;

export const CompanyKeysSchema = z.object({
  ids: z.array(IdSchema).nonempty().max(50),
  ats: AtsSchema,
});
/**
 * - ids: An array of companyIds (ATS slugs)
 * - ats: The ATS type for all provided company ids
 */
export type CompanyKeys = z.infer<typeof CompanyKeysSchema>;

export const JobKeySchema = z.object({ id: IdSchema, companyId: IdSchema });
/**
 * - id: The ATS-granted jobId
 * - pKey: companyId
 */
export type JobKey = z.infer<typeof JobKeySchema>;

export const FullJobKeySchema = z.object({
  companyId: IdSchema,
  jobId: IdSchema,
  ats: AtsSchema,
});
// Not inferred -> this is split on validation into separate company and job keys
export type FullJobKey = { jobKey: JobKey; companyKey: CompanyKey };

// #endregion

export interface Company
  extends CompanyKey, DeepPartialNullToUndef<ExtractionCompany> {
  name: string;
}

export interface Job extends JobKey, DeepPartialNullToUndef<ExtractionJob> {
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;

  // Denormalized from Company to reduce joins
  companyStage?: Company["stage"];
  companySize?: Company["size"];
}

/**
 * Job to ignore during ATS refresh.
 * - id: The ATS-granted job id
 * - atsCompany: `${ats}+${companyId}`
 * - Index: Point reads only
 * - TTL: 90 Days
 */
export interface IgnoreJob {
  id: string;
  atsCompany: string;
  reason: string;
}

/**
 * Latest ETag for an ATS resource.
 * - id: The workflow path assuming responsibility
 * - atsCompany: `${ats}+${companyId}`
 * - Index: Point reads only
 * - TTL: 30 Days
 */
export interface ETag {
  id: string;
  atsCompany: string;
  etag: string;
}

/**
 * Aggregated metadata for other containers. Cached in the backend service.
 * - id: The type of metadata
 * - pKey: id
 * - Index: Point reads only
 */
export interface Metadata {
  // Keys
  id: "company" | "job";

  // For company type
  companyCount?: number;
  companyQuickRef?: CompanyQuickRef[];

  // For job type
  jobCount?: number;
  recentJobCount?: number;
  presenceCounts?: Partial<Record<Presence, number>>;
  jobFamilyCounts?: Partial<Record<JobFamily, number>>;
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
