import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";

export abstract class ATSInterface {
  /** Get company information from the ATS */
  abstract getCompany(key: CompanyKey): Promise<Company>;

  /**
   * Get all of a company's jobs from the ATS.
   * @param meta If true and the ATS supports it, only fetch metadata (no context, item valid but not fully defined)
   */
  abstract getJobs(key: CompanyKey, meta?: boolean): Promise<Context<Job>[]>;

  /** Get detailed information for an example job */
  abstract getExampleJob(key: CompanyKey): Promise<Context<Job> | undefined>;

  /** Get detailed information for a specific job */
  abstract getSpecificJob(
    jobKey: JobKey,
    key: CompanyKey,
  ): Promise<Context<Job>>;
}
