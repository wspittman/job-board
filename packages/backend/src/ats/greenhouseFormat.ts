import { standardizeUntrustedHtml } from "dry-utils-text";
import type { Company, Job } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { normTitle } from "./normalization.ts";

export interface CompanyResult {
  name: string;
  content: string;
}

interface JobsResultGeneric<T> {
  jobs: T[];
  meta: {
    total: number;
  };
}
export type JobsResult = JobsResultGeneric<JobResult>;
export type JobsResultBasic = JobsResultGeneric<JobResultBasic>;

export interface JobResultBasic {
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

export interface JobResult extends JobResultBasic {
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

export function formatCompany(
  id: string,
  { name, content }: CompanyResult,
): Company {
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

export function formatJobBasic(
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

export function formatJob(
  companyId: string,
  jobResult: JobResult,
): Context<Job> {
  const result = formatJobBasic(companyId, jobResult);

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

export function formatJobsBasic(companyId: string, { jobs }: JobsResultBasic) {
  return jobs.map((job) => formatJobBasic(companyId, job));
}

export function formatJobs(companyId: string, { jobs }: JobsResult) {
  return jobs.map((job) => formatJob(companyId, job));
}
