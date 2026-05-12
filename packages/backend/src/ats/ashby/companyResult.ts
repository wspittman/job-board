import type { JobResult } from "./jobResult.ts";

export type CompanyResult = {
  jobs: JobResult[];
  apiVersion: string;
};
