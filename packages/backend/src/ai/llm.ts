import { subscribeOpenAILogging } from "dry-utils-openai";
import type { Company, Job } from "../models/models.ts";
import type { Location } from "../types/dbModels.ts";
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
  private model?: string;

  constructor(model?: string) {
    this.model = model;
  }

  async fillCompanyInfo(company: Context<Company>) {
    return fillCompanyInfo(company, this.model);
  }

  async extractLocation(location: Location) {
    return extractLocation(location, this.model);
  }

  async fillJobInfo(job: Context<Job>) {
    return fillJobInfo(job, this.model);
  }
}

export const llm = new LLMConnector();

export function specificLLM(model: string) {
  return new LLMConnector(model);
}
