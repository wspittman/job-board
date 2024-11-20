import axios from "axios";
import { config } from "../config";
import type { Company } from "../db/models";
import { checkStatus } from "../utils/axios";
import { standardizeUntrustedHtml } from "../utils/html";
import type { AtsEndpoint, JobUpdates } from "./types";
import { splitJobs } from "./utils";

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
  async getCompany(id: string): Promise<Company> {
    const result = await axios.get<GreenhouseCompanyResult>(
      `${config.GREENHOUSE_URL}/${id}`
    );

    checkStatus(result, ["Greenhouse", id]);

    const { name, content } = result.data;

    return {
      id,
      ats: "greenhouse",
      name,
      description: standardizeUntrustedHtml(content),
    };
  }

  async getJobUpdates(
    company: Company,
    currentIds: string[]
  ): Promise<JobUpdates> {
    const result = await axios.get<GreenhouseJobsResult>(
      `${config.GREENHOUSE_URL}/${company.id}/jobs?content=true`
    );

    checkStatus(result, ["Greenhouse", company.id]);

    const {
      added: addedRaw,
      removed,
      existing,
    } = splitJobs(result.data.jobs, currentIds, (job) => job.id.toString());

    const added = addedRaw.map((job) => {
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

    return { added, removed, kept: existing };
  }
}
