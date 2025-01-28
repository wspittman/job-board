import type { ClientJob } from "./clientModels";
import type { Job } from "./dbModels";

// This file is going to get a lot more interesting later on

export const toClientJobs = (jobs: Job[]): ClientJob[] => jobs.map(toClientJob);

export const toClientJob = ({
  id,
  companyId,
  company,
  title,
  description,
  postTS,
  applyUrl,
  isRemote,
  location,
  facets,
}: Job): ClientJob => {
  return {
    id,
    companyId,
    company,
    title,
    description,
    postTS,
    applyUrl,
    isRemote,
    location,
    facets,
  };
};
