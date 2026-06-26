import { standardizeUntrustedHtml } from "dry-utils-text";
import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import type { CompanyResult } from "./ashby/companyResult.ts";
import type { JobResult } from "./ashby/jobResult.ts";
import { ATSBase } from "./atsBase.ts";
import { normTitle } from "./normalization.ts";

const NAME = "ashby";
export class Ashby extends ATSBase {
  constructor() {
    super(NAME, config.ASHBY_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    return Promise.resolve(this.#formatCompany(id));
  }

  async getJobs({ id }: CompanyKey): Promise<Context<Job>[]> {
    const { jobs } = await this.#fetchCompany(id);
    return jobs.map((job) => this.#formatJob(id, job));
  }

  async getExampleJob({ id }: CompanyKey): Promise<Context<Job> | undefined> {
    const { jobs } = await this.#fetchCompany(id);

    if (!jobs.length) return undefined;

    const idx = Math.floor(Math.random() * jobs.length);
    const job = jobs[idx]!;
    return this.#formatJob(id, job);
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

    return this.#formatJob(companyId, job);
  }

  #formatCompany(id: string): Company {
    id = id.trim();
    return {
      // Keys
      id,
      ats: NAME,

      // Basic
      // No name field, just use token until we have a better solution
      name: id[0]?.toUpperCase() + id.slice(1),
    };
  }

  #formatJob(companyId: string, jobResult: JobResult): Context<Job> {
    if (jobResult.isListed === false) {
      logError(
        `Ashby.formatJob: ${companyId}\\${jobResult.id} marked as unlisted.`,
      );
    }

    const result = this.#formatJobBasic(companyId, jobResult);

    const {
      address,
      compensation,
      id,
      descriptionHtml,
      department,
      employmentType,
      secondaryLocations,
      team,
      location,
      workplaceType,
    } = jobResult;

    result.item.description = standardizeUntrustedHtml(descriptionHtml);

    // Useful pieces that aren't redundant with the job object
    const context = {
      description: `Additional information about the job ${id}`,
      content: {
        address,
        compensation,
        department,
        employmentType,
        secondaryLocations,
        team,
        location: location,
        workplaceType,
      },
    };
    result.context = [context];

    return result;
  }

  async #fetchCompany(id: string): Promise<CompanyResult> {
    const route = "?includeCompensation=true";
    return this.httpCall<CompanyResult>("Company", id, route);
  }

  #formatJobBasic(
    companyId: string,
    { id, title, publishedAt, applyUrl }: JobResult,
  ): Context<Job> {
    const job: Job = {
      // Keys
      id: id,
      companyId: companyId,

      // Basic
      title: normTitle(title),
      description: "",
      postTS: new Date(publishedAt).getTime(),
      applyUrl: applyUrl,
    };

    // NOTE: Don't set context here because refreshJobInfo depends on it being undefined to know when to fetch full job data
    return { item: job };
  }
}
