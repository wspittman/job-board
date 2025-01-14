import type { ATS, Company, CompanyKey, Job, JobKey } from "../types/dbModels";
import type { LLMContext } from "../types/types";
import { ATSBase } from "./atsBase";
import { Greenhouse } from "./greenhouse";
import { Lever } from "./lever";

class ATSConnector {
  private readonly atsEndpoints: Record<ATS, ATSBase> = {
    greenhouse: new Greenhouse(),
    lever: new Lever(),
  };

  getAtsList(): ATS[] {
    return Object.keys(this.atsEndpoints) as ATS[];
  }

  async getBasicCompany(key: CompanyKey): Promise<Company> {
    return this.atsEndpoints[key.ats].getBasicCompany(key);
  }

  async getCompany(key: CompanyKey): Promise<LLMContext<Company>> {
    return this.atsEndpoints[key.ats].getCompany(key);
  }

  async getJobs(key: CompanyKey, full?: boolean): Promise<LLMContext<Job>[]> {
    return this.atsEndpoints[key.ats].getJobs(key, full);
  }

  async getJob(key: CompanyKey, jobKey: JobKey): Promise<LLMContext<Job>> {
    return this.atsEndpoints[key.ats].getJob(key, jobKey);
  }
}

export const ats = new ATSConnector();
