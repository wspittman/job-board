import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import type { CompanyResult } from "./ashby/companyResult.ts";
import { formatCompany, formatJob } from "./ashbyFormat.ts";
import { ATSBase } from "./atsBase.ts";

const NAME = "ashby";
export class Ashby extends ATSBase {
  constructor() {
    super(NAME, config.ASHBY_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    await this.#validateKey(id);
    return Promise.resolve(formatCompany(id));
  }

  async getJobs({ id }: CompanyKey): Promise<Context<Job>[]> {
    const { jobs } = await this.#fetchCompany(id);
    return jobs.map((job) => formatJob(id, job));
  }

  async getExampleJob({ id }: CompanyKey): Promise<Context<Job> | undefined> {
    const { jobs } = await this.#fetchCompany(id);

    if (!jobs.length) return undefined;

    const idx = Math.floor(Math.random() * jobs.length);
    const job = jobs[idx]!;
    return formatJob(id, job);
  }

  async getSpecificJob({ id, companyId }: JobKey): Promise<Context<Job>> {
    // Ashby ALWAYS returns the all jobs, so we have to fetch them all and find the right one
    // This is inefficient and should be avoided
    // We log an error so we can track if this accidentally happens in production
    logError("Ashby.getSpecificJob: This should never be called when deployed");

    const { jobs } = await this.#fetchCompany(companyId);
    const job = jobs.find((job) => job.id === id);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return formatJob(companyId, job);
  }

  async #validateKey(id: string) {
    return this.httpCall<CompanyResult>("Company", id, "");
  }

  async #fetchCompany(id: string): Promise<CompanyResult> {
    const route = "?includeCompensation=true";
    return this.httpCall<CompanyResult>("Company", id, route);
  }
}
