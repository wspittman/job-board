import type { Job } from "../types/dbModels";
import type { Context } from "../types/types";
import { extractFacets } from "./extractFacets";
import { extractLocation, extractLocations } from "./extractLocation";

class LLMConnector {
  constructor() {}

  async extractLocations(job: Context<Job>) {
    return extractLocations(job);
  }

  async extractLocation(text: string) {
    return (await extractLocation(text))?.location;
  }

  async extractFacets(job: Context<Job>) {
    return extractFacets(job);
  }
}

export const llm = new LLMConnector();
