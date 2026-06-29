import { config } from "../config.ts";
import type { CompanyKey, JobKey } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import { ATSBase } from "./atsBase.ts";
import {
  formatCompany,
  formatJob,
  formatJobs,
  type JobResult,
} from "./leverFormat.ts";

/**
 * Lever ATS integration implementation that handles job and company data retrieval
 * from Lever's job board API
 */
export class Lever extends ATSBase {
  constructor() {
    super("lever", config.LEVER_URL, true);
  }

  async getCompany({ id }: CompanyKey) {
    await this.#validateKey(id);
    return Promise.resolve(formatCompany(id));
  }

  async getJobs({ id }: CompanyKey) {
    // Note: Metadata unsupported
    const res = await this.#fetchJobs(id);
    return formatJobs(id, res);
  }

  async getJobsETag({ id }: CompanyKey, etag?: string) {
    // Note: Metadata unsupported
    const res = await this.#fetchJobsETag(id, etag);
    return this.formatTags(id, res, formatJobs);
  }

  async getExampleJob({ id }: CompanyKey) {
    const job = await this.#fetchSingleJob(id);
    return job ? formatJob(id, job) : undefined;
  }

  async getSpecificJob({ id, companyId }: JobKey) {
    // Lever ALWAYS returns the top X jobs, so we have to fetch them all and find the right one
    // This is inefficient and should be avoided
    // We log an error so we can track if this accidentally happens in production
    logError("Lever.getSpecificJob: This should never be called when deployed");

    const jobs = await this.#fetchJobs(companyId);
    const job = jobs.find((job) => job.id === id);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return formatJob(companyId, job);
  }

  async #validateKey(id: string) {
    const query = "?mode=json&limit=1";
    return this.httpCall<JobResult[]>("Jobs", id, query);
  }

  async #fetchSingleJob(id: string) {
    const query = "?mode=json&limit=1";
    const jobs = await this.httpCall<JobResult[]>("Jobs", id, query);
    return jobs[0];
  }

  async #fetchJobs(id: string) {
    const query = "?mode=json";
    return this.httpCall<JobResult[]>("Jobs", id, query);
  }

  async #fetchJobsETag(id: string, etag?: string) {
    const query = "?mode=json";
    return this.httpCallETag<JobResult[]>("Jobs", id, query, etag);
  }
}
