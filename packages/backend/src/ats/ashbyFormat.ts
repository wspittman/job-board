import { standardizeUntrustedHtml } from "dry-utils-text";
import type { Company, Job } from "../models/models.ts";
import { logError } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import type { JobResult } from "./ashby/jobResult.ts";
import { normTitle } from "./normalization.ts";

export function formatCompany(id: string): Company {
  id = id.trim();
  return {
    // Keys
    id,
    ats: "ashby",

    // Basic
    // No name field, just use token until we have a better solution
    name: id[0]?.toUpperCase() + id.slice(1),
  };
}

function formatJobBasic(
  companyId: string,
  { id, title, publishedAt, applyUrl }: JobResult,
): Context<Job> {
  const job: Job = {
    // Keys
    id: id,
    companyId: companyId,

    // Basic
    title: normTitle(title),
    description: "",
    postTS: new Date(publishedAt).getTime(),
    applyUrl: applyUrl,
  };

  // NOTE: Don't set context here because refreshJobInfo depends on it being undefined to know when to fetch full job data
  return { item: job };
}

export function formatJob(
  companyId: string,
  jobResult: JobResult,
): Context<Job> {
  if (jobResult.isListed === false) {
    logError(
      `Ashby.formatJob: ${companyId}\\${jobResult.id} marked as unlisted.`,
    );
  }

  const result = formatJobBasic(companyId, jobResult);

  const {
    address,
    compensation,
    id,
    descriptionHtml,
    department,
    employmentType,
    secondaryLocations,
    team,
    location,
    workplaceType,
  } = jobResult;

  result.item.description = standardizeUntrustedHtml(descriptionHtml);

  // Useful pieces that aren't redundant with the job object
  const context = {
    description: `Additional information about the job ${id}`,
    content: {
      address,
      compensation,
      department,
      employmentType,
      secondaryLocations,
      team,
      location: location,
      workplaceType,
    },
  };
  result.context = [context];

  return result;
}
