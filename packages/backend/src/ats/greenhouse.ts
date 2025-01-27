import { config } from "../config";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels";
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

export class Greenhouse extends ATSBase {
  constructor() {
    super("greenhouse", config.GREENHOUSE_URL);
  }

  async getCompany({ id }: CompanyKey): Promise<Company> {
    return this.fetchCompany(id);
  }

  async getJobs(key: CompanyKey, full = false): Promise<Job[]> {
    const { jobs } = await this.fetchJobs(key.id, full);
    return jobs.map((job) => this.formatJob(key, job));
  }

  async getJob(key: CompanyKey, { id, companyId }: JobKey): Promise<Job> {
    const response = await this.fetchJob(companyId, id);
    return this.formatJob(key, response);
  }

  private async fetchCompany(id: string): Promise<Company> {
    const response = await this.axiosCall<CompanyResult>("Company", id, "");
    return this.formatCompany(id, response);
  }

  private async fetchJob(id: string, jobId: string): Promise<JobResult> {
    return this.axiosCall<JobResult>("Job", id, `jobs/${jobId}`);
  }

  private async fetchJobs(id: string, full: boolean): Promise<JobsResult> {
    const callName = `Jobs${full ? " (full)" : ""}`;
    const url = `/jobs${full ? "?content=true" : ""}`;
    return this.axiosCall<JobsResult>(callName, id, url);
  }

  private formatCompany(id: string, { name, content }: CompanyResult): Company {
    return {
      id,
      ats: "greenhouse",
      name,
      description: standardizeUntrustedHtml(content),
    };
  }

  private formatJob({ id: companyId }: CompanyKey, job: JobResult): Job {
    return {
      id: job.id.toString(),
      companyId: companyId,
      company: companyId,
      title: job.title,
      isRemote: job.location.name.toLowerCase().includes("remote"),
      location: job.location.name,
      description: standardizeUntrustedHtml(job.content),
      postTS: new Date(job.updated_at).getTime(),
      applyUrl: job.absolute_url,
      facets: {},
    };
  }
}
