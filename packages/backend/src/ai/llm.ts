import type { Company, Job, Location } from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { extractFacets } from "./extractFacets.ts";
import { extractLocation } from "./extractLocation.ts";
import { fillCompanyInfo } from "./fillCompanyInfo.ts";

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
