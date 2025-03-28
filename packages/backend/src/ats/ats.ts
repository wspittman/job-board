import type {
  ATS,
  Company,
  CompanyKey,
  Job,
  JobKey,
} from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { ATSBase } from "./atsBase.ts";
import { Greenhouse } from "./greenhouse.ts";
import { Lever } from "./lever.ts";

class ATSConnector {
  private readonly atsEndpoints: Record<ATS, ATSBase> = {
    greenhouse: new Greenhouse(),
    lever: new Lever(),
  };

  /**
   * Retrieves company information from the appropriate ATS
   * @param full - Whether to fetch full company details
   */
  async getCompany(key: CompanyKey, full?: boolean): Promise<Context<Company>> {
    return this.atsEndpoints[key.ats].getCompany(key, full);
  }

  /**
   * Fetches jobs for a company from the appropriate ATS
   * @param full - Whether to fetch full job details
   */
  async getJobs(key: CompanyKey, full?: boolean): Promise<Context<Job>[]> {
    return this.atsEndpoints[key.ats].getJobs(key, full);
  }

  /**
   * Retrieves detailed information for a specific job
   */
  async getJob(key: CompanyKey, jobKey: JobKey): Promise<Context<Job>> {
    return this.atsEndpoints[key.ats].getJob(jobKey);
  }
}

/**
 * Singleton instance of ATSConnector that provides access to different ATS implementations
 */
export const ats = new ATSConnector();
