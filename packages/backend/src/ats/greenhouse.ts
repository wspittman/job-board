import { standardizeUntrustedHtml } from "dry-utils-text";
import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { ATSBase } from "./atsBase.ts";
import { normTitle } from "./normalization.ts";

interface CompanyResult {
  name: string;
  content: string;
}

interface JobsResultGeneric<T> {
  jobs: T[];
  meta: {
    total: number;
  };
}
type JobsResult = JobsResultGeneric<JobResult>;
type JobsResultBasic = JobsResultGeneric<JobResultBasic>;

interface JobResultBasic {
  id: number;
  internal_job_id: number;
  title: string;
  updated_at: string;
  requisition_id: string;
  location: {
    name: string;
  };
  absolute_url: string;
  metadata?: unknown;
}

interface JobResult extends JobResultBasic {
  content: string;
  departments: {
    id: number;
    name: string;
    parent_id?: number;
    child_ids: number[];
  }[];
  offices: {
    id: number;
    name: string;
    location: string;
    parent_id?: number;
    child_ids: number[];
  }[];
}

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
    return this.#formatCompany(id, companyResult);
  }

  async getJobs({ id }: CompanyKey, meta = false): Promise<Context<Job>[]> {
    if (meta) {
      const { jobs } = await this.#fetchJobsBasic(id);
      return jobs.map((job) => this.#formatJobBasic(id, job));
    } else {
      const { jobs } = await this.#fetchJobs(id);
      return jobs.map((job) => this.#formatJob(id, job));
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
    return this.#formatJob(companyId, response);
  }

  #formatCompany(id: string, { name, content }: CompanyResult): Company {
    return {
      // Keys
      id,
      ats: "greenhouse",

      // Basic
      name: name.trim(),

      // We might have this given to us, we might need to extract it
      description: standardizeUntrustedHtml(content),
    };
  }

  #formatJobBasic(
    companyId: string,
    { id, title, updated_at, absolute_url }: JobResultBasic,
  ): Context<Job> {
    const job: Job = {
      // Keys
      id: String(id),
      companyId: companyId,

      // Basic
      title: normTitle(title),
      description: "",
      postTS: new Date(updated_at).getTime(),
      applyUrl: absolute_url,
    };

    // NOTE: Don't set context here because refreshJobInfo depends on it being undefined to know when to fetch full job data
    return { item: job };
  }

  #formatJob(companyId: string, jobResult: JobResult): Context<Job> {
    const result = this.#formatJobBasic(companyId, jobResult);

    const { id, metadata, content, departments, offices, location } = jobResult;

    result.item.description = standardizeUntrustedHtml(content);

    // Useful pieces that aren't redundant with the job object
    const context = {
      description: `Additional information about the job ${id}`,
      content: {
        metadata,
        departments,
        offices,
        location: location.name,
      },
    };
    result.context = [context];

    return result;
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
