import { normalizedLocation } from "../utils/location.ts";
import { stripObj } from "../utils/objUtils.ts";
import type { ClientJob } from "./clientModels.ts";
import type { Job } from "./models.ts";

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
  workTimeBasis,
  jobFamily,
}: Job): ClientJob => {
  const encodeId = encodeURIComponent(id);
  const encodeCompanyId = encodeURIComponent(companyId);
  const applyUrl = `/job/apply?id=${encodeId}&companyId=${encodeCompanyId}`;

  return stripObj({
    // Keys
    id,
    companyId,

    // The Work
    title,
    company: companyName,
    workTimeBasis,
    jobFamily,

    // The Compensation
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
