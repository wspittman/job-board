import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { ATSBase } from "./atsBase.ts";
import {
  formatCompany,
  formatJob,
  formatJobs,
  formatJobsBasic,
  type CompanyResult,
  type JobResult,
  type JobsResult,
  type JobsResultBasic,
} from "./greenhouseFormat.ts";

/**
 * Greenhouse ATS integration implementation that handles job and company data retrieval
 * from Greenhouse's job board API
 */
export class Greenhouse extends ATSBase {
  constructor() {
    super("greenhouse", config.GREENHOUSE_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    const companyResult = await this.#fetchCompany(id);
    return formatCompany(id, companyResult);
  }

  async getJobs({ id }: CompanyKey, meta = false): Promise<Context<Job>[]> {
    if (meta) {
      const res = await this.#fetchJobsBasic(id);
      return formatJobsBasic(id, res);
    } else {
      const res = await this.#fetchJobs(id);
      return formatJobs(id, res);
    }
  }

  async getExampleJob({ id }: CompanyKey): Promise<Context<Job> | undefined> {
    const { jobs } = await this.#fetchJobsBasic(id);

    if (!jobs.length) return undefined;

    const idx = Math.floor(Math.random() * jobs.length);
    const jobId = String(jobs[idx]!.id);
    return await this.getSpecificJob({ id: jobId, companyId: id });
  }

  async getSpecificJob({ id, companyId }: JobKey): Promise<Context<Job>> {
    const response = await this.#fetchJob(companyId, id);
    return formatJob(companyId, response);
  }

  async #fetchCompany(id: string) {
    return this.httpCall<CompanyResult>("Company", id, "");
  }

  async #fetchJob(id: string, jobId: string) {
    return this.httpCall<JobResult>("Job", id, `jobs/${jobId}`);
  }

  async #fetchJobs(id: string) {
    return this.httpCall<JobsResult>("Jobs", id, "/jobs?content=true");
  }

  async #fetchJobsBasic(id: string) {
    return this.httpCall<JobsResultBasic>("JobsBasic", id, "/jobs");
  }
}
