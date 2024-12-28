import { Job, Metadata } from "../db/models";

export type ClientJob = Job;

export type ClientMetadata = Pick<
  Metadata,
  "companyCount" | "companyNames" | "jobCount"
> & { timestamp: number };
