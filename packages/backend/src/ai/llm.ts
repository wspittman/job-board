import type { Company, Job, Location } from "../types/dbModels";
import type { Context } from "../types/types";
import { extractLocation } from "./extractLocation";
import { fillCompanyInfo } from "./fillCompanyInfo";
import { fillJobInfo } from "./fillJobInfo";

class LLMConnector {
  constructor() {}

  async fillCompanyInfo(company: Context<Company>) {
    return fillCompanyInfo(company);
  }

  async fillJobInfo(job: Context<Job>) {
    return fillJobInfo(job);
  }

  async extractLocation(location: Location) {
    return extractLocation(location);
  }
}

export const llm = new LLMConnector();
