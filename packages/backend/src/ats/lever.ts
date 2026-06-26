import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
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
    super("lever", config.LEVER_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    await this.#validateKey(id);
    return Promise.resolve(formatCompany(id));
  }

  async getJobs({ id }: CompanyKey): Promise<Context<Job>[]> {
    const jobs = await this.#fetchJobs(id);
    return formatJobs(id, jobs);
  }

  async getExampleJob({ id }: CompanyKey): Promise<Context<Job> | undefined> {
    const jobs = await this.#fetchJobs(id);

    if (!jobs.length) return undefined;

    const idx = Math.floor(Math.random() * jobs.length);
    const job = jobs[idx]!;
    return formatJob(id, job);
  }

  async getSpecificJob({ id, companyId }: JobKey): Promise<Context<Job>> {
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

  async #fetchJobs(id: string) {
    const query = "?mode=json";
    return this.httpCall<JobResult[]>("Jobs", id, query);
  }
}
