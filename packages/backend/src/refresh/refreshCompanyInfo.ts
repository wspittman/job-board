import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { CompanyKey } from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";

export const companyInfoQueue = new AsyncQueue(
  "RefreshCompanyInfo",
  refreshCompanyInfo,
);

/**
 * Refreshes AI-enriched company details from ATS company and example job data.
 * @param key Company identifier containing id and ATS type
 * @returns Resolved when company information has been refreshed when possible
 */
async function refreshCompanyInfo(key: CompanyKey) {
  logProperty("Input", key);
  const company = await ats.getCompany(key);
  const exampleJob = await ats.getExampleJob(key);

  if (exampleJob) {
    const context = {
      description: "Example job from the company",
      content: {
        ...exampleJob.item,
        ...(exampleJob.context?.[0]?.content ?? {}),
      },
    };

    const success = await llm.fillCompanyInfo({
      item: company,
      context: [context],
    });

    if (success) {
      await db.company.upsert(company);
    }
  }
}
