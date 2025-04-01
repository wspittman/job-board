import { standardizeUntrustedHtml } from "dry-utils/htmldown";
import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
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

  async getCompany(
    { id }: CompanyKey,
    _full?: boolean
  ): Promise<Context<Company>> {
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

  async getJobs({ id }: CompanyKey, _: boolean): Promise<Context<Job>[]> {
    const jobs = await this.fetchJobs(id);
    return jobs.map((job) => this.formatJob(id, job));
  }

  async getJob(_: JobKey): Promise<Context<Job>> {
    throw new AppError("This should never be called", 500);
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
      id,
      companyId: companyId,
      company: companyId,
      title: text,
      location: `${workplaceType}: [${categories.allLocations.join("; ")}]`,
      description: standardizeUntrustedHtml(jdHtml),
      postTS: new Date(createdAt).getTime(),
      applyUrl,
      facets: {},
    };

    // Useful pieces that aren't redundant with the job object
    const context = {
      description: `Additional information about the job ${id}`,
      content: {
        categories,
        country,
        workplaceType,
        salaryRange,
      },
    };

    return {
      item: job,
      context: [context],
    };
  }

  private async fetchJobs(id: string, single = false): Promise<JobResult[]> {
    const query = single ? "?mode=json&limit=1" : "?mode=json";
    return this.axiosCall<JobResult[]>("Jobs", id, query);
  }
}
