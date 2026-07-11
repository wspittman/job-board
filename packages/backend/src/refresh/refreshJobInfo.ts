import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { CompanyKey, Job } from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";
import { refreshMetadata } from "./refreshMetadata.ts";

export const jobInfoQueue = new AsyncQueue("RefreshJobInfo", refreshJobInfo, {
  onComplete: refreshMetadata,
  taskDelayMs: 25,
});

/**
 * Refreshes AI-enriched job details and saves eligible jobs.
 * @param input Company identifier and ATS job context
 * @returns Resolved when job information has been refreshed or skipped
 */
async function refreshJobInfo([companyKey, job]: [CompanyKey, Context<Job>]) {
  logProperty("Input", { ...companyKey, jobId: job.item.id });

  const skip = async (reason: string, value: string) => {
    logProperty(`Skipped_${reason}`, value);
    await db.ignoreJob.upsert(job.item.id, companyKey, reason);
    return;
  };

  if (await llm.isGeneralApplication(job.item.title)) {
    return await skip("GeneralApplication", job.item.title);
  }

  if (!job.context) {
    job = await ats.getSpecificJob(job.item, companyKey);
  }

  const success = await llm.fillJobInfo(job);

  // Do not add a job that failed to extract facets
  if (!success) {
    throw new AppError(
      `${companyKey.ats}/${companyKey.id}/${job.item.id}: Extraction Failure`,
    );
  }

  // This is a stopgap until we can add better US-only filters prior to main LLM processing.
  const language = job.item.jdLanguage || "en";
  const currency = job.item.salaryRange?.currency || "USD";
  const location = job.item.primaryLocation?.countryCode || "US";
  if (language.toLowerCase() !== "en") {
    return await skip("NonEnglish", language);
  }
  if (currency.toUpperCase() !== "USD") {
    return await skip("NonUSD", currency);
  }
  if (location.toUpperCase() !== "US") {
    return await skip("NonUS", location);
  }

  await db.job.upsert(job.item);
}
