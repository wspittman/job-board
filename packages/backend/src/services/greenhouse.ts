import axios from "axios";
import { config } from "../config";
import { Job } from "../db/job";

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

export async function getGreenhouseJobs(company: string): Promise<Job[]> {
  const rawJobs = (
    await axios.get<GreenhouseJobsResult>(
      `${config.GREENHOUSE_URL}/${company}/jobs?content=true`
    )
  ).data.jobs;

  return rawJobs.map((job) => ({
    company,
    title: job.title,
    description: job.content,
    postDate: job.updated_at,
    applyUrl: job.absolute_url,
  }));
}
