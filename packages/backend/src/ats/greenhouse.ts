import { config } from "../config";
import type { Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import { LLMContext } from "../types/types";
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

  async getBasicCompany({ id }: CompanyKey): Promise<Company> {
    return this.fetchCompany(id);
  }

  async getCompany({ id }: CompanyKey): Promise<LLMContext<Company>> {
    const company = await this.fetchCompany(id);
    const result: LLMContext<Company> = { item: company };

    const { jobs } = await this.fetchJobs(id, false);

    if (jobs.length) {
      result.context = {
        exampleJob: await this.fetchJob(id, jobs[0].id.toString()),
      };
    }

    return result;
  }

  async getJobs(key: CompanyKey, full = false): Promise<LLMContext<Job>[]> {
    const { jobs } = await this.fetchJobs(key.id, full);
    return jobs.map((job) => this.jobWithContext(key, job));
  }

  async getJob(
    key: CompanyKey,
    { id, companyId }: JobKey
  ): Promise<LLMContext<Job>> {
    const response = await this.fetchJob(companyId, id);
    return this.jobWithContext(key, response);
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

  private jobWithContext(key: CompanyKey, job: JobResult): LLMContext<Job> {
    return {
      item: this.formatJob(key, job),
      // TODO: strip out huge keys? or allow list only keys not fully used in item?
      context: { jobData: job },
    };
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
      title: job.title,
      //isRemote: job.location.name.toLowerCase().includes("remote"),
      //location: job.location.name,
      description: standardizeUntrustedHtml(job.content),
      postTS: new Date(job.updated_at).getTime(),
      applyUrl: job.absolute_url,
      //facets: {},
      locations: [],
      compensation: {},
      role: {},
    };
  }
}
