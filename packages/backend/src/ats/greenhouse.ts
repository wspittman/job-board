import axios from "axios";
import { extractLocations } from "../ai/extractLocation";
import { config } from "../config";
import type { Company } from "../db/models";
import { checkStatus } from "../utils/axios";
import { removeHtml } from "../utils/html";
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
      description: removeHtml(content),
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

    const rawLocations = addedRaw.map((job) => job.location.name);
    const locations = await extractLocations(rawLocations);

    const added = addedRaw.map((job, index) => {
      const { isRemote, location } = locations[index] ?? {
        // Fallback if the location extraction fails
        isRemote: job.location.name.toLowerCase().includes("remote"),
        location: job.location.name,
      };

      return {
        id: job.id.toString(),
        companyId: company.id,
        company: company.name,
        title: job.title,
        isRemote,
        location,
        description: removeHtml(job.content),
        postTS: new Date(job.updated_at).getTime(),
        applyUrl: job.absolute_url,
      };
    });

    return { added, removed, kept: existing };
  }
}
