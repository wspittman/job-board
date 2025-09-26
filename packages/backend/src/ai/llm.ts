import { subscribeOpenAILogging } from "dry-utils-openai";
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
}

export const llm = new LLMConnector();
