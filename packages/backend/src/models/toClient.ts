import { normalizedLocation } from "../utils/location.ts";
import { stripObj } from "../utils/objUtils.ts";
import type { ClientJob } from "./clientModels.ts";
import type { Job } from "./models.ts";

export type CompanyNameLookup = (companyId: string) => string | undefined;

export const toClientJobs = (
  jobs: Job[],
  companyNameLookup?: CompanyNameLookup,
): ClientJob[] => jobs.map((job) => toClientJob(job, companyNameLookup));

export const toClientJob = (
  {
    id,
    companyId,
    title,
    description,
    postTS,
    presence,
    primaryLocation,
    salaryRange,
    requiredExperience,
    summary,
    workTimeBasis,
    jobFamily,
  }: Job,
  companyNameLookup?: CompanyNameLookup,
): ClientJob => {
  const encodeId = encodeURIComponent(id);
  const encodeCompanyId = encodeURIComponent(companyId);
  const applyUrl = `/job/apply?id=${encodeId}&companyId=${encodeCompanyId}`;

  return stripObj({
    // Keys
    id,
    companyId,

    // The Work
    title,
    company: companyNameLookup?.(companyId) ?? companyId,
    workTimeBasis,
    jobFamily,

    // The Compensation
    currency: salaryRange?.currency,
    minSalary: salaryRange?.min,
    payCadence: salaryRange?.cadence,

    // Other
    description,
    postTS,
    applyUrl,
    isRemote: presence === "remote",
    location: primaryLocation ? normalizedLocation(primaryLocation) : "",
    facets: {
      summary: summary ?? undefined,
      experience: requiredExperience ?? undefined,
    },
  });
};
