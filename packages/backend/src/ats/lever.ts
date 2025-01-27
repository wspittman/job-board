import { config } from "../config";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { standardizeUntrustedHtml } from "../utils/html";
import { ATSBase } from "./atsBase";

interface JobResult {
  id: string;
  text: string;
  categories: {
    commitment: string;
    location: string;
    team: string;
    department: string;
    allLocations: string[];
  };
  country: string;
  // Available in dual properties of description (styles HTML) and descriptionPlain (plaintext)
  // Also there are opening\openingPlain, and descriptionBody\descriptionBodyPlain, which are subsets of description
  description: string;
  openingPlain: string;
  lists: {
    text: string;
    content: string;
  }[];
  additionalPlain: string;
  hostedUrl: string;
  applyUrl: string;
  workplaceType: "unspecified" | "on-site" | "remote" | "hybrid";
  salaryRange?: {
    currency: string;
    interval: string;
    min: number;
    max: number;
  };
  salaryDescriptionPlain?: string;
  createdAt: number;
}

export class Lever extends ATSBase {
  constructor() {
    super("lever", config.LEVER_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    const [exampleJob] = await this.fetchJobs(id, true);

    if (!exampleJob) {
      // Since we can't gather proper name/description, treat as not found
      throw new AppError(`Lever / ${id}: Not Found`, 404);
    }

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

  private formatCompany(id: string, { openingPlain }: JobResult): Company {
    return {
      id,
      ats: "lever",
      // No name field, just use token until we have a better solution
      name: id,
      description: openingPlain,
    };
  }

  private formatJob({ id: companyId }: CompanyKey, job: JobResult): Job {
    return {
      id: job.id,
      companyId: companyId,
      company: companyId,
      title: job.text,
      isRemote:
        job.workplaceType === "remote" ||
        job.categories.allLocations.some((x) =>
          x.toLowerCase().includes("remote")
        ),
      location: `${job.workplaceType}: [${job.categories.allLocations.join(
        "; "
      )}]`,
      description: standardizeUntrustedHtml(job.description),
      postTS: new Date(job.createdAt).getTime(),
      applyUrl: job.applyUrl,
      facets: {},
    };
  }
}
