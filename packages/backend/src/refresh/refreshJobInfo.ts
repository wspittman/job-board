import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { CompanyKey, Job } from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";
import { refreshMetadata } from "./refreshMetadata.ts";

interface JobInfoWork {
  key: CompanyKey & { jobId: string };
  job: Context<Job>;
}

export const jobInfoQueue = new AsyncQueue<JobInfoWork>(
  "RefreshJobInfo",
  refreshJobInfo,
  {
    onComplete: refreshMetadata,
    taskDelayMs: 25,
  },
);

/**
 * Refreshes AI-enriched job details and saves eligible jobs.
 * @param input Company identifier and ATS job context
 * @returns Resolved when job information has been refreshed or skipped
 */
async function refreshJobInfo(work: JobInfoWork) {
  const key = work.key;
  logProperty("Input", key);

  if (await metadataFilters(work)) {
    return;
  }

  work.job = work.job.context
    ? work.job
    : await ats.getSpecificJob(work.job.item, key);

  if (await contextFilters(work)) {
    return;
  }

  const success = await llm.fillJobInfo(work.job);

  // Do not add a job that failed to extract facets
  if (!success) {
    throw new AppError(`${key.ats}/${key.id}/${key.jobId}: Extraction Failure`);
  }

  if (await postProcessingFilters(work)) {
    return;
  }

  await db.job.upsert(work.job.item);
}

async function metadataFilters(work: JobInfoWork) {
  // Heuristic filters go here

  // LLM-based filters go here
  const title = work.job.item.title;
  if (await llm.isGeneralApplication(title)) {
    return await skip(work, "GeneralApplication", title);
  }

  return false;
}

// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
async function contextFilters(_work: JobInfoWork) {
  // Heuristic filters go here

  // LLM-based filters go here

  return false;
}

async function postProcessingFilters(work: JobInfoWork) {
  // Heuristic filters go here

  // This is a stopgap until we can add better US-only filters prior to main LLM processing.
  const language = work.job.item.jdLanguage || "en";
  const currency = work.job.item.salaryRange?.currency || "USD";
  const location = work.job.item.primaryLocation?.countryCode || "US";
  if (language.toLowerCase() !== "en") {
    return await skip(work, "NonEnglish", language);
  }
  if (currency.toUpperCase() !== "USD") {
    return await skip(work, "NonUSD", currency);
  }
  if (location.toUpperCase() !== "US") {
    return await skip(work, "NonUS", location);
  }

  // LLM-based filters go here

  return false;
}

async function skip({ key }: JobInfoWork, reason: string, value: string) {
  logProperty(`Skipped_${reason}`, value);
  await db.ignoreJob.upsert(key.jobId, key, reason);
  return true;
}
