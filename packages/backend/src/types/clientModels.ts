import type { Job, Metadata } from "./dbModels";

export type ClientJob = Job;

export type ClientMetadata = Pick<
  Metadata,
  "companyCount" | "companyNames" | "jobCount"
> & { timestamp: number };
