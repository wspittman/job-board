import { normalizedLocation } from "../utils/location.ts";
import type { ClientJob } from "./clientModels.ts";
import type { Job } from "./models.ts";

// This file is going to get a lot more interesting later on

export const toClientJobs = (jobs: Job[]): ClientJob[] => jobs.map(toClientJob);

export const toClientJob = ({
  id,
  companyId,
  title,
  description,
  postTS,
  applyUrl,
  companyName,
  presence,
  jobType,
  jobFamily,
  seniorityLevel,
  primaryLocation,
  remoteEligibility,
  salaryRange,
  variableComp,
  benefitHighlights,
  requiredEducation,
  requiredExperience,
  summary,
}: Job): ClientJob => {
  return {
    id,
    companyId,
    company: companyName,
    title,
    description,
    postTS,
    applyUrl,
    isRemote: presence === "remote",
    location: primaryLocation ? normalizedLocation(primaryLocation) : "",
    facets: {
      summary: summary ?? undefined,
      salary: salaryRange?.min ?? undefined,
      experience: requiredExperience ?? undefined,
    },
  };
};
