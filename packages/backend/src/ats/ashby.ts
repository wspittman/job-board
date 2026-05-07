import type { JobResult } from "./ashby/jobResult.ts";
import { config } from "../config.ts";
import { ATSBase } from "./atsBase.ts";
import type { CompanyKey, Company, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import type { CompanyResult } from "./ashby/companyResult.ts";
import { normTitle } from "./normalization.ts";
import { standardizeUntrustedHtml } from "dry-utils-text";
import { AppError } from "../utils/AppError.ts";
import { logError } from "../utils/telemetry.ts";

const NAME = "ashby";
export class Ashby extends ATSBase {
  constructor() {
    super(NAME, config.ASHBY_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Context<Company>> {
    const companyResult = await this.fetchCompany(id);
    const company = this.formatCompany(id);
    if (companyResult.jobs.length > 0 && companyResult.jobs[0]) {
      const exampleJob = this.formatJob(id, companyResult.jobs[0]);

      const context = {
        description: "Example job from the company",
        content: { ...exampleJob },
      };

      return {
        item: company,
        context: [context],
      };
    }

    return { item: company };
  }

  async getJobs({ id }: CompanyKey): Promise<Context<Job>[]> {
    const { jobs } = await this.fetchCompany(id, true);
    return jobs.map((job) => this.formatJob(id, job));
  }

  async getJob(jobKey: JobKey): Promise<Context<Job>> {
    // Ashby ALWAYS returns the all jobs, so we have to fetch them all and find the right one
    // This is inefficient and should be avoided
    // We log an error so we can track if this accidentally happens in production
    logError("Ashby.getJob: This should never be called when deployed");

    const { jobs } = await this.fetchCompany(jobKey.companyId, true);
    const job = jobs.find((job) => job.id === jobKey.id);
    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return this.formatJob(jobKey.companyId, job);
  }

  private formatCompany(id: string): Company {
    return {
      // Keys
      id,
      ats: NAME,

      // Basic
      name: id.trim(),
    };
  }

  private formatJob(companyId: string, jobResult: JobResult): Context<Job> {
    const result = this.formatJobBasic(companyId, jobResult);

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

  private async fetchCompany(
    id: string,
    includeComp: boolean = false,
  ): Promise<CompanyResult> {
    const route = includeComp ? "?includeCompensation=true" : "";
    return this.httpCall<CompanyResult>("Company", id, route);
  }

  private formatJobBasic(
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
