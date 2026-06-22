import type { ATS, CompanyKey, JobKey } from "../models/models.ts";
import { Ashby } from "./ashby.ts";
import { ATSBase, ATSInterface } from "./atsBase.ts";
import { Greenhouse } from "./greenhouse.ts";
import { Lever } from "./lever.ts";

class ATSConnector extends ATSInterface {
  readonly #atsEndpoints: Record<ATS, ATSBase> = {
    greenhouse: new Greenhouse(),
    lever: new Lever(),
    ashby: new Ashby(),
  };

  getCompany(key: CompanyKey) {
    return this.#atsEndpoints[key.ats].getCompany(key);
  }

  getJobs(key: CompanyKey, meta?: boolean) {
    return this.#atsEndpoints[key.ats].getJobs(key, meta);
  }

  getExampleJob(key: CompanyKey) {
    return this.#atsEndpoints[key.ats].getExampleJob(key);
  }

  getSpecificJob(jobKey: JobKey, key: CompanyKey) {
    return this.#atsEndpoints[key.ats].getSpecificJob(jobKey, key);
  }
}

/**
 * Singleton instance of ATSConnector that provides access to different ATS implementations
 */
export const ats = new ATSConnector();
