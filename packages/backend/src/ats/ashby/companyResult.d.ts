import type { JobResult } from "./jobResult.js"

export type CompanyResult = {
  name: string,
  jobs: JobResult[],
  apiVersion: string
}