import type { Company, Job } from "../types/dbModels";
import type { LLMContext } from "../types/types";
import { fillCompanyInfo } from "./fillCompanyInfo";

class LLMConnector {
  constructor() {}

  async fillCompanyInfo(companyContext: LLMContext<Company>) {
    return fillCompanyInfo(companyContext);
  }

  async fillJobInfo(jobContext: LLMContext<Job>) {
    throw new Error("Not Implemented");
  }

  // What type should this return?
  async normalizeLocation(location: string) {
    throw new Error("Not Implemented");
  }
}

export const llm = new LLMConnector();
