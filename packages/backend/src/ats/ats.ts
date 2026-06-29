import type { ATS, CompanyKey, JobKey } from "../models/models.ts";
import { Ashby } from "./ashby.ts";
import { ATSBase } from "./atsBase.ts";
import { ATSInterface } from "./ATSInterface.ts";
import { Greenhouse } from "./greenhouse.ts";
import { Lever } from "./lever.ts";

class ATSConnector extends ATSInterface {
  readonly #atsEndpoints: Record<ATS, ATSBase> = {
    greenhouse: new Greenhouse(),
    lever: new Lever(),
    ashby: new Ashby(),
  };

  supportsETag(key: CompanyKey) {
    return this.#atsEndpoints[key.ats].supportsETag();
  }

  getCompany(key: CompanyKey) {
    return this.#atsEndpoints[key.ats].getCompany(key);
  }

  getJobs(key: CompanyKey, onlyMetadata?: boolean) {
    return this.#atsEndpoints[key.ats].getJobs(key, onlyMetadata);
  }

  getJobsETag(key: CompanyKey, etag?: string, onlyMetadata?: boolean) {
    return this.#atsEndpoints[key.ats].getJobsETag(key, etag, onlyMetadata);
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
