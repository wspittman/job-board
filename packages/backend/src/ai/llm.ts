import type { Company, Job } from "../types/dbModels";
import type { LLMContext } from "../types/types";
import { fillCompanyInfo } from "./fillCompanyInfo";
import { fillJobInfo } from "./fillJobInfo";

class LLMConnector {
  constructor() {}

  async fillCompanyInfo(companyContext: LLMContext<Company>) {
    return fillCompanyInfo(companyContext);
  }

  async fillJobInfo(jobContext: LLMContext<Job>) {
    return fillJobInfo(jobContext);
  }
}

export const llm = new LLMConnector();
