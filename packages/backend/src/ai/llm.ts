import type { Job } from "../types/dbModels";
import { extractFacets } from "./extractFacets";
import { extractLocation, extractLocations } from "./extractLocation";

class LLMConnector {
  constructor() {}

  async extractLocations(job: Job) {
    return extractLocations(job);
  }

  async extractLocation(text: string) {
    return (await extractLocation(text))?.location;
  }

  async extractFacets(job: Job) {
    return extractFacets(job);
  }
}

export const llm = new LLMConnector();
