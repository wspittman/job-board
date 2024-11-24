import { config } from "../config";
import type { Company, Job } from "../db/models";
import { standardizeUntrustedHtml } from "../utils/html";
import type { AtsEndpoint } from "./types";

interface GreenhouseCompanyResult {
  name: string;
  content: string;
}

interface GreenhouseJobsResult {
  jobs: GreenhouseJob[];
  meta: {
    total: number;
  };
}

interface GreenhouseJob {
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

export class Greenhouse implements AtsEndpoint {
  getCompanyEndpoint(id: string): string {
    return `${config.GREENHOUSE_URL}/${id}`;
  }

  getJobsEndpoint(id: string): string {
    return `${config.GREENHOUSE_URL}/${id}/jobs?content=true`;
  }

  formatCompany(
    id: string,
    { name, content }: GreenhouseCompanyResult
  ): Company {
    return {
      id,
      ats: "greenhouse",
      name,
      description: standardizeUntrustedHtml(content),
    };
  }

  getRawJobs({
    jobs,
  }: GreenhouseJobsResult): [id: string, job: GreenhouseJob][] {
    return jobs.map((job) => [job.id.toString(), job]);
  }

  formatJobs(company: Company, jobs: GreenhouseJob[]): Job[] {
    return jobs.map((job) => {
      return {
        id: job.id.toString(),
        companyId: company.id,
        company: company.name,
        title: job.title,
        isRemote: job.location.name.toLowerCase().includes("remote"),
        location: job.location.name,
        description: standardizeUntrustedHtml(job.content),
        postTS: new Date(job.updated_at).getTime(),
        applyUrl: job.absolute_url,
        facets: {},
      };
    });
  }
}
