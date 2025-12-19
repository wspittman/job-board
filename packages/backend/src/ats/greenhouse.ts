import { standardizeUntrustedHtml } from "dry-utils-text";
import { config } from "../config.ts";
import type { Company, CompanyKey, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { ATSBase } from "./atsBase.ts";

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

  async getCompany(
    { id }: CompanyKey,
    full?: boolean,
  ): Promise<Context<Company>> {
    const companyResult = await this.fetchCompany(id);
    const company = this.formatCompany(id, companyResult);

    if (!full) {
      return { item: company };
    }

    const { jobs } = await this.fetchJobsBasic(id);

    if (jobs.length) {
      const exampleJob = await this.getJob({
        id: String(jobs[0]?.id),
        companyId: id,
      });

      const context = {
        description: "Example job from the company",
        content: {
          ...exampleJob.item,
          ...(exampleJob.context?.[0]?.content ?? {}),
        },
      };

      return {
        item: company,
        context: [context],
      };
    }

    return { item: company };
  }

  async getJobs({ id }: CompanyKey, full = false): Promise<Context<Job>[]> {
    if (!full) {
      const { jobs } = await this.fetchJobsBasic(id);
      return jobs.map((job) => this.formatJobBasic(id, job));
    } else {
      const { jobs } = await this.fetchJobs(id);
      return jobs.map((job) => this.formatJob(id, job));
    }
  }

  async getJob({ id, companyId }: JobKey): Promise<Context<Job>> {
    const response = await this.fetchJob(companyId, id);
    return this.formatJob(companyId, response);
  }

  private formatCompany(id: string, { name, content }: CompanyResult): Company {
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

  private formatJobBasic(
    companyId: string,
    { id, title, updated_at, absolute_url }: JobResultBasic,
  ): Context<Job> {
    const job: Job = {
      // Keys
      id: String(id),
      companyId: companyId,

      // Basic
      title: title?.trim(),
      description: "",
      postTS: new Date(updated_at).getTime(),
      applyUrl: absolute_url,
      companyName: companyId,
    };

    // NOTE: Don't set context here because refreshJobInfo depends on it being undefined to know when to fetch full job data
    return { item: job };
  }

  private formatJob(companyId: string, jobResult: JobResult): Context<Job> {
    const result = this.formatJobBasic(companyId, jobResult);

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

  private async fetchCompany(id: string): Promise<CompanyResult> {
    return this.httpCall<CompanyResult>("Company", id, "");
  }

  private async fetchJob(id: string, jobId: string): Promise<JobResult> {
    return this.httpCall<JobResult>("Job", id, `jobs/${jobId}`);
  }

  private async fetchJobs(id: string): Promise<JobsResult> {
    return this.httpCall<JobsResult>("Jobs", id, "/jobs?content=true");
  }

  private async fetchJobsBasic(id: string): Promise<JobsResultBasic> {
    return this.httpCall<JobsResultBasic>("JobsBasic", id, "/jobs");
  }
}
