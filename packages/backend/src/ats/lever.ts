import { standardizeUntrustedHtml } from "dry-utils-text";
import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { logError } from "../utils/telemetry.ts";
import { ATSBase } from "./atsBase.ts";

interface JobResult {
  id: string;
  createdAt: number;
  applyUrl: string;

  // Job title
  text: string;

  // JD sections, available in pairs of X (styled HTML) and XPlain (plaintext)
  // "description" is always "opening" + "descriptionBody"
  description: string;
  additional: string;
  salaryDescription?: string;

  // JD sections, but text is a plaintext name and content is a styled HTML list
  lists: {
    text: string;
    content: string;
  }[];

  // Useful metadata
  categories: {
    commitment: string;
    location: string;
    team: string;
    department: string;
    allLocations: string[];
  };
  country: string;
  workplaceType: "unspecified" | "on-site" | "remote" | "hybrid";
  salaryRange?: {
    currency: string;
    interval: string;
    min: number;
    max: number;
  };
}

/**
 * Lever ATS integration implementation that handles job and company data retrieval
 * from Lever's job board API
 */
export class Lever extends ATSBase {
  constructor() {
    super("lever", config.LEVER_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Context<Company>> {
    const [exampleJob] = await this.fetchJobs(id, true);
    const company = this.formatCompany(id);

    if (!exampleJob) return { item: company };

    const cleanJob = this.formatJob(id, exampleJob);

    const context = {
      description: "Example job from the company",
      content: {
        ...cleanJob.item,
        ...(cleanJob.context?.[0]?.content ?? {}),
      },
    };

    return {
      item: company,
      context: [context],
    };
  }

  async getJobs({ id }: CompanyKey): Promise<Context<Job>[]> {
    const jobs = await this.fetchJobs(id);
    return jobs.map((job) => this.formatJob(id, job));
  }

  async getJob({ id, companyId }: JobKey): Promise<Context<Job>> {
    // Lever ALWAYS returns the top X jobs, so we have to fetch them all and find the right one
    // This is inefficient and should be avoided
    // We log an error so we can track if this accidentally happens in production
    logError("Lever.getJob: This should never be called when deployed");

    const jobs = await this.fetchJobs(companyId);
    const job = jobs.find((job) => job.id === id);

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return this.formatJob(companyId, job);
  }

  private formatCompany(id: string): Company {
    return {
      // Keys
      id,
      ats: "lever",

      // Basic
      // No name field, just use token until we have a better solution
      name: id[0]?.toUpperCase() + id.slice(1),
    };
  }

  private formatJob(
    companyId: string,
    {
      id,
      createdAt,
      applyUrl,
      text,
      description,
      additional,
      salaryDescription = "",
      lists = [],
      categories,
      country,
      workplaceType,
      salaryRange,
    }: JobResult
  ): Context<Job> {
    const listHtml = lists
      .map(({ text, content }) => `<p>${text}</p><ul>${content}</ul>`)
      .join("");

    const jdHtml = `<div>${description}<div>${listHtml}</div>${salaryDescription}${additional}</div>`;

    const job: Job = {
      // Keys
      id,
      companyId: companyId,

      // Basic
      title: text?.trim(),
      description: standardizeUntrustedHtml(jdHtml),
      postTS: new Date(createdAt).getTime(),
      applyUrl,
      companyName: companyId,
    };

    // Useful pieces that aren't redundant with the job object
    const context = {
      description: `Additional information about the job ${id}`,
      content: {
        categories,
        country,
        workplaceType,
        salaryRange,
        location: `${workplaceType}: [${categories.allLocations.join("; ")}]`,
      },
    };

    return {
      item: job,
      context: [context],
    };
  }

  private async fetchJobs(id: string, single = false): Promise<JobResult[]> {
    const query = single ? "?mode=json&limit=1" : "?mode=json";
    return this.httpCall<JobResult[]>("Jobs", id, query);
  }
}
