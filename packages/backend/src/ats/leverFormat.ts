import { standardizeUntrustedHtml } from "dry-utils-text";
import type { Company, Job } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { normTitle } from "./normalization.ts";

export interface JobResult {
  id: string;
  createdAt: number;
  applyUrl: string;

  // Job title
  text: string;

  // JD sections, available in pairs of X (styled HTML) and XPlain (plaintext)
  // "description" is always "opening" + "descriptionBody"
  description: string;
  additional: string;
  salaryDescription?: string;

  // JD sections, but text is a plaintext name and content is a styled HTML list
  lists: {
    text: string;
    content: string;
  }[];

  // Useful metadata
  categories: {
    commitment: string;
    location: string;
    team: string;
    department: string;
    allLocations: string[];
  };
  country: string;
  workplaceType: "unspecified" | "on-site" | "remote" | "hybrid";
  salaryRange?: {
    currency: string;
    interval: string;
    min: number;
    max: number;
  };
}

export function formatCompany(id: string): Company {
  return {
    // Keys
    id,
    ats: "lever",

    // Basic
    // No name field, just use token until we have a better solution
    name: id[0]?.toUpperCase() + id.slice(1),
  };
}

export function formatJob(
  companyId: string,
  {
    id,
    createdAt,
    applyUrl,
    text,
    description,
    additional,
    salaryDescription = "",
    lists = [],
    categories,
    country,
    workplaceType,
    salaryRange,
  }: JobResult,
): Context<Job> {
  const listHtml = lists
    .map(({ text, content }) => `<p>${text}</p><ul>${content}</ul>`)
    .join("");

  const jdHtml = `<div>${description}<div>${listHtml}</div>${salaryDescription}${additional}</div>`;

  const job: Job = {
    // Keys
    id,
    companyId: companyId,

    // Basic
    title: normTitle(text),
    description: standardizeUntrustedHtml(jdHtml),
    postTS: new Date(createdAt).getTime(),
    applyUrl,
  };

  // Useful pieces that aren't redundant with the job object
  const context = {
    description: `Additional information about the job ${id}`,
    content: {
      categories,
      country,
      workplaceType,
      salaryRange,
      location: `${workplaceType}: [${categories.allLocations.join("; ")}]`,
    },
  };

  return {
    item: job,
    context: [context],
  };
}

export function formatJobs(companyId: string, jobs: JobResult[]) {
  return jobs.map((job) => formatJob(companyId, job));
}
