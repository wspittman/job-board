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
  companyName,
  presence,
  primaryLocation,
  salaryRange,
  requiredExperience,
  summary,
}: Job): ClientJob => {
  const encodeId = encodeURIComponent(id);
  const encodeCompanyId = encodeURIComponent(companyId);
  const applyUrl = `/job/apply?id=${encodeId}&companyId=${encodeCompanyId}`;
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
