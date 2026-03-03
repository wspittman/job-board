import { subscribeOpenAILogging } from "dry-utils-openai";
import type { InterpretQuery } from "../models/clientModels.ts";
import type { Company, Job } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import {
  createSubscribeAggregator,
  subscribeError,
  subscribeLog,
} from "../utils/telemetry.ts";
import { extractLocation } from "./extractLocation.ts";
import { fillCompanyInfo } from "./fillCompanyInfo.ts";
import { fillJobInfo } from "./fillJobInfo.ts";
import { interpretQuery } from "./interpretQuery.ts";
import { isGeneralApplication } from "./isGeneralApplication.ts";

subscribeOpenAILogging({
  log: subscribeLog,
  error: subscribeError,
  aggregate: createSubscribeAggregator("llm", 10),
});

class LLMConnector {
  async fillCompanyInfo(company: Context<Company>) {
    return fillCompanyInfo(company);
  }

  async extractLocation(location: string) {
    return extractLocation(location);
  }

  async fillJobInfo(job: Context<Job>) {
    return fillJobInfo(job);
  }

  async isGeneralApplication(title: string) {
    return isGeneralApplication(title);
  }

  async interpretQuery(query: InterpretQuery) {
    return interpretQuery(query);
  }
}

export const llm = new LLMConnector();
