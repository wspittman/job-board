import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import type { Context } from "../types/types";
import { ATSBase } from "./atsBase";
import { Greenhouse } from "./greenhouse";
import { Lever } from "./lever";

class ATSConnector {
  private readonly atsEndpoints: Record<ATS, ATSBase> = {
    greenhouse: new Greenhouse(),
    lever: new Lever(),
  };

  /**
   * Returns a list of supported ATS systems
   */
  getAtsList(): ATS[] {
    return Object.keys(this.atsEndpoints) as ATS[];
  }

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
    return this.atsEndpoints[key.ats].getJob(key, jobKey);
  }
}

/**
 * Singleton instance of ATSConnector that provides access to different ATS implementations
 */
export const ats = new ATSConnector();
