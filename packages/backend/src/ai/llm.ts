import type { Company, Job, Location } from "../types/dbModels";
import type { Context } from "../types/types";
import { extractFacets } from "./extractFacets";
import { extractLocation } from "./extractLocation";
import { fillCompanyInfo } from "./fillCompanyInfo";

class LLMConnector {
  constructor() {}

  async fillCompanyInfo(company: Context<Company>) {
    return fillCompanyInfo(company);
  }

  async extractLocation(location: Location) {
    return extractLocation(location);
  }

  async extractFacets(job: Context<Job>) {
    return extractFacets(job);
  }
}

export const llm = new LLMConnector();
