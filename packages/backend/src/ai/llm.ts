import { setAILogging } from "@dry-utils/openai";
import type { Company, Job, Location } from "../types/dbModels.ts";
import type { Context } from "../types/types.ts";
import { getSubContext, logError, logProperty } from "../utils/telemetry.ts";
import { extractFacets } from "./extractFacets.ts";
import { extractLocation } from "./extractLocation.ts";
import { fillCompanyInfo } from "./fillCompanyInfo.ts";

const initialContext = () => ({
  count: 0,
  counts: {},
  tokens: 0,
  inTokens: 0,
  outTokens: 0,
  cacheTokens: 0,
  ms: 0,
});

setAILogging({
  logFn: logProperty,
  errorFn: (msg, val) => logError(new Error(msg, { cause: val })),
  aggregatorFn: () => getSubContext("llm", initialContext),
  storeCalls: true,
});

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
