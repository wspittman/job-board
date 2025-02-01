import { config } from "../config";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import type { Context } from "../types/types";
import { standardizeUntrustedHtml } from "../utils/html";
import { ATSBase } from "./atsBase";

interface CompanyResult {
  name: string;
  content: string;
}

interface JobsResult {
  jobs: JobResult[];
  meta: {
    total: number;
  };
}

interface JobResult {
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
    full?: boolean
  ): Promise<Context<Company>> {
    const companyResult = await this.fetchCompany(id);
    const result = this.formatCompany(id, companyResult);

    if (!full) {
      return result;
    }

    const { jobs } = await this.fetchJobs(id, false);

    if (jobs.length) {
      result.context = {
        exampleJob: await this.fetchJob(id, jobs[0].id.toString()),
      };
    }

    return result;
  }

  async getJobs(key: CompanyKey, full = false): Promise<Context<Job>[]> {
    const { jobs } = await this.fetchJobs(key.id, full);
    return jobs.map((job) => this.formatJob(key, job));
  }

  async getJob(
    key: CompanyKey,
    { id, companyId }: JobKey
  ): Promise<Context<Job>> {
    const response = await this.fetchJob(companyId, id);
    return this.formatJob(key, response);
  }

  private async fetchCompany(id: string): Promise<CompanyResult> {
    return this.axiosCall<CompanyResult>("Company", id, "");
  }

  private async fetchJob(id: string, jobId: string): Promise<JobResult> {
    return this.axiosCall<JobResult>("Job", id, `jobs/${jobId}`);
  }

  private async fetchJobs(id: string, full: boolean): Promise<JobsResult> {
    const callName = `Jobs${full ? " (full)" : ""}`;
    const url = `/jobs${full ? "?content=true" : ""}`;
    return this.axiosCall<JobsResult>(callName, id, url);
  }

  private formatCompany(
    id: string,
    { name, content }: CompanyResult
  ): Context<Company> {
    const company: Company = {
      id,
      ats: "greenhouse",
      name,
      description: standardizeUntrustedHtml(content),
    };

    return { item: company };
  }

  private formatJob(
    { id: companyId }: CompanyKey,
    {
      id,
      title,
      updated_at,
      location,
      absolute_url,
      metadata,
      content,
      departments,
      offices,
    }: JobResult
  ): Context<Job> {
    const job: Job = {
      id: String(id),
      companyId: companyId,
      company: companyId,
      title,
      isRemote: location.name.toLowerCase().includes("remote"),
      location: location.name,
      description: standardizeUntrustedHtml(content),
      postTS: new Date(updated_at).getTime(),
      applyUrl: absolute_url,
      facets: {},
    };

    // Useful pieces that aren't redundant with the job object
    const context = {
      location,
      metadata,
      departments,
      offices,
    };

    return {
      item: job,
      context,
    };
  }
}
