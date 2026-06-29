import { config } from "../config.ts";
import type { CompanyKey, JobKey } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import type { CompanyResult } from "./ashby/companyResult.ts";
import { formatCompany, formatJob } from "./ashbyFormat.ts";
import { ATSBase } from "./atsBase.ts";

const NAME = "ashby";
export class Ashby extends ATSBase {
  constructor() {
    super(NAME, config.ASHBY_URL, false);
  }

  async getCompany({ id }: CompanyKey) {
    await this.#validateKey(id);
    return Promise.resolve(formatCompany(id));
  }

  async getJobs({ id }: CompanyKey) {
    // Note: Metadata unsupported
    const { jobs } = await this.#fetchJobs(id);
    return jobs.map((job) => formatJob(id, job));
  }

  async getJobsETag(key: CompanyKey) {
    // Note: Metadata and ETag unsupported
    const res = await this.getJobs(key);
    return { stable: false, data: res };
  }

  async getExampleJob({ id }: CompanyKey) {
    const { jobs } = await this.#fetchJobs(id);

    if (!jobs.length) return undefined;

    const idx = Math.floor(Math.random() * jobs.length);
    const job = jobs[idx]!;
    return formatJob(id, job);
  }

  async getSpecificJob({ id, companyId }: JobKey) {
    // Ashby ALWAYS returns the all jobs, so we have to fetch them all and find the right one
    // This is inefficient and should be avoided
    // We log an error so we can track if this accidentally happens in production
    logError("Ashby.getSpecificJob: This should never be called when deployed");

    const { jobs } = await this.#fetchJobs(companyId);
    const job = jobs.find((job) => job.id === id);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return formatJob(companyId, job);
  }

  async #validateKey(id: string) {
    return this.httpCall<CompanyResult>("Company", id, "");
  }

  async #fetchJobs(id: string) {
    const route = "?includeCompensation=true";
    return this.httpCall<CompanyResult>("Company", id, route);
  }
}
