import { config } from "../config";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { standardizeUntrustedHtml } from "../utils/html";
import { ATSBase } from "./atsBase";

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
  salaryDescription: string;

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

export class Lever extends ATSBase {
  constructor() {
    super("lever", config.LEVER_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    const [exampleJob] = await this.fetchJobs(id, true);
    return this.formatCompany(id, exampleJob);
  }

  async getJobs(key: CompanyKey, _: boolean): Promise<Job[]> {
    const jobs = await this.fetchJobs(key.id);
    return jobs.map((job) => this.formatJob(key, job));
  }

  async getJob(_1: CompanyKey, _2: JobKey): Promise<Job> {
    throw new AppError("This should never be called", 500);
  }

  private async fetchJobs(id: string, single = false): Promise<JobResult[]> {
    const query = single ? "?mode=json&limit=1" : "?mode=json";
    return this.axiosCall<JobResult[]>("Jobs", id, query);
  }

  private formatCompany(id: string, _toBeUsedLater: JobResult): Company {
    return {
      id,
      ats: "lever",
      // No name field, just use token until we have a better solution
      name: id[0].toUpperCase() + id.slice(1),
      // No descriptions until we do better company info crawls
      description: "",
    };
  }

  private formatJob(
    { id: companyId }: CompanyKey,
    {
      id,
      createdAt,
      applyUrl,
      text,
      description,
      additional,
      salaryDescription,
      lists = [],
      categories,
      workplaceType,
    }: JobResult
  ): Job {
    const listHtml = lists
      .map(({ text, content }) => `<h3>${text}</h3><ul>${content}</ul>`)
      .join("");

    const jdHtml = `<div>${description}<div>${listHtml}<div>${salaryDescription}${additional}</div>`;

    return {
      id,
      companyId: companyId,
      company: companyId,
      title: text,
      isRemote:
        workplaceType === "remote" ||
        categories.allLocations.some((x) => x.toLowerCase().includes("remote")),
      location: `${workplaceType}: [${categories.allLocations.join("; ")}]`,
      description: standardizeUntrustedHtml(jdHtml),
      postTS: new Date(createdAt).getTime(),
      applyUrl,
      facets: {},
    };
  }
}
