import { batch } from "dry-utils-async";
import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { RefreshJobsOptions } from "../models/clientModels.ts";
import type { CompanyKey, CompanyKeys, FullJobKey } from "../models/models.ts";
import { refreshJobsForCompany } from "../refresh/jobs.ts";
import { refreshMetadata } from "../refresh/refreshMetadata.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";

const companyInfoQueue = new AsyncQueue(
  "RefreshCompanyInfo",
  refreshCompanyInfo,
);
const companyJobQueue = new AsyncQueue(
  "RefreshJobsForCompany",
  refreshJobsForCompany,
  {
    onComplete: refreshMetadata,
    concurrentLimit: 3,
    taskDelayMs: 150,
  },
);

/**
 * Adds a single company to the database if it doesn't exist
 * @param key - Company identifier containing id and ATS type
 * @returns Promise resolving when company is added
 */
export async function addCompany(key: CompanyKey) {
  const added = await addCompanyInternal(key);
  if (added) {
    companyInfoQueue.add([key]);
  }
}

/**
 * Adds multiple companies to the database
 * @param param0 - Object containing array of company IDs and ATS type
 * @returns Promise resolving when all companies are added
 */
export async function addCompanies({ ids, ats }: CompanyKeys) {
  const keys = ids.map((id) => ({ id, ats }));
  await batch("AddCompanies", keys, async (key) => {
    await addCompanyInternal(key);
  });
  companyInfoQueue.add(keys);
}

/**
 * Removes a company and all its associated jobs from the database
 * @param key - Company identifier containing id and ATS type
 * @returns Promise resolving when company and its jobs are removed
 */
export async function removeCompany(key: CompanyKey) {
  const companyId = key.id;
  const [, idRes] = await Promise.all([
    db.company.remove(key),
    db.job.removeAll(companyId),
    db.eTag.deleteAll(key),
  ]);

  if (idRes.length) {
    refreshMetadata();
  }
}

export async function refreshCompanies() {
  const keys = await db.company.getKeys();
  companyInfoQueue.add(keys);
}

/**
 * Refreshes jobs for specified companies and updates metadata
 * @param param0 - Options for refreshing jobs including ATS type, company IDs, and age threshold
 * @returns Promise resolving when jobs are refreshed and metadata is updated
 */
export async function refreshJobs({
  ats,
  companyIds,
  replaceJobsOlderThan,
}: RefreshJobsOptions) {
  let keys: (CompanyKey & { replaceJobsOlderThan?: number })[];

  if (companyIds && ats) {
    const companies = await Promise.all(
      companyIds.map((id) => db.company.get({ id, ats })),
    );
    const missing = companyIds.filter((_, i) => !companies[i]);
    if (missing.length) {
      throw new AppError(`Companies not found: ${missing.join(", ")}`);
    }
    keys = companyIds.map((id) => ({ id, ats }));
  } else if (ats) {
    const ids = await db.company.getIds(ats);
    keys = ids.map((id) => ({ id, ats }));
  } else {
    keys = await db.company.getKeys();
  }

  if (replaceJobsOlderThan) {
    keys = keys.map((key) => ({ ...key, replaceJobsOlderThan }));
  }

  companyJobQueue.add(keys);
}

/**
 * Syncs denormalized company fields for all jobs tied to a company.
 * @param key - Company identifier containing id and ATS type
 * @returns Summary of job updates performed
 */
export async function syncCompanyJobs(key: CompanyKey) {
  const company = await db.company.get(key);
  if (!company) {
    throw new AppError("Company not found");
  }

  const jobs = await db.job.getAll(company.id);
  const updates = jobs.flatMap((job) => {
    const companyStage = company.stage;
    const companySize = company.size;
    const needsUpdate =
      job.companyStage !== companyStage || job.companySize !== companySize;

    if (!needsUpdate) {
      return [];
    }

    return [
      {
        ...job,
        companyStage,
        companySize,
      },
    ];
  });

  if (updates.length) {
    await batch("SyncCompanyJobs", updates, (job) => db.job.upsert(job));
  }

  return { updatedJobs: updates.length, totalJobs: jobs.length };
}

/**
 * Deletes a job and marks it as ignored for its company to prevent re-adding from ATS sync
 * @param key - Full job identifier containing companyKey and jobKey
 * @returns Promise resolving when the job is deleted
 */
export async function ignoreJob({ companyKey, jobKey }: FullJobKey) {
  await Promise.all([
    db.ignoreJob.upsert(jobKey.id, companyKey, "Manual"),
    db.job.remove(jobKey),
  ]);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return false;

  const company = await ats.getCompany(key);
  await db.company.upsert(company);

  // Don't add to companyInfoQueue here, we want the caller to do it so they can batch
  return true;
}

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
