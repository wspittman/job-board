import type { JobResult } from "./ashby/jobResult.d.ts";
import { config } from "../config.ts";
import { ATSBase } from "./atsBase.ts";
import type { CompanyKey, Company, Job, JobKey } from "../models/models.ts";
import type { Context } from "../types/types.ts";

export class Ashby extends ATSBase {
  constructor() {
    super("ashby", config.ASHBY_URL);
  }

  override getCompany(key: CompanyKey, full?: boolean): Promise<Context<Company>> {
    throw new Error("Method not implemented.");
  }
  override getJobs(key: CompanyKey, full?: boolean): Promise<Context<Job>[]> {
    throw new Error("Method not implemented.");
  }
  override getJob(jobKey: JobKey): Promise<Context<Job>> {
    throw new Error("Method not implemented.");
  }

  private async fetchJobs(id: string, single = false): Promise<JobResult[]> {
    const query = single ? "?mode=json&limit=1" : "?mode=json";
    return this.httpCall<JobResult[]>("Jobs", id, query);
  }
}
