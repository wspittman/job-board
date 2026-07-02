import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";

export type Tags<T> =
  { stable: true } | { stable: false; data: T; etag?: string };

export abstract class ATSInterface {
  /** True if this ATS support ETag caching */
  abstract supportsETag(key: CompanyKey): boolean;

  /** Get company information from the ATS */
  abstract getCompany(key: CompanyKey): Promise<Company>;

  /**
   * Get all of a company's jobs from the ATS.
   * @param key The company identifier
   * @param meta If true and the ATS supports it, only fetch metadata (no context, item valid but not fully defined)
   */
  abstract getJobs(key: CompanyKey, meta?: boolean): Promise<Context<Job>[]>;

  /**
   * Get all of a company's jobs from the ATS using ETag caching, if supported.
   * @param key The company identifier
   * @param meta If true and the ATS supports it, only fetch metadata (no context, item valid but not fully defined)
   * @param etag If truthy, send this etag value to the ATS
   */
  abstract getJobsETag(
    key: CompanyKey,
    etag?: string,
    meta?: boolean,
  ): Promise<Tags<Context<Job>[]>>;

  /** Get detailed information for an example job */
  abstract getExampleJob(key: CompanyKey): Promise<Context<Job> | undefined>;

  /** Get detailed information for a specific job */
  abstract getSpecificJob(
    jobKey: JobKey,
    key: CompanyKey,
  ): Promise<Context<Job>>;
}
