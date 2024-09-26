import axios from "axios";
import { config } from "../config";
import type { Company, CompanyInput } from "../db/company";
import type { Job } from "../db/job";
import { checkStatus } from "./utils";

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

export async function getGreenhouseCompany(
  company: CompanyInput
): Promise<Company> {
  const result = await axios.get<GreenhouseCompanyResult>(
    `${config.GREENHOUSE_URL}/${company.id}`
  );

  checkStatus(result, ["Greenhouse", company.id]);

  const { name, content } = result.data;

  return {
    ...company,
    name,
    // Basic HTML tag removal
    description: content.replace(/<[^>]*>/g, ""),
  };
}

export async function getGreenhouseJobs(company: Company): Promise<Job[]> {
  const result = await axios.get<GreenhouseJobsResult>(
    `${config.GREENHOUSE_URL}/${company.id}/jobs?content=true`
  );

  checkStatus(result, ["Greenhouse", company.id]);

  const rawJobs = result.data.jobs;

  return rawJobs.map((job) => ({
    id: job.id.toString(),
    companyId: company.id,
    company: company.name,
    title: job.title,
    // Simple keyword match for now
    isRemote: job.location.name.toLowerCase().includes("remote"),
    location: job.location.name,
    description: job.content,
    postDate: job.updated_at,
    applyUrl: job.absolute_url,
  }));
}
