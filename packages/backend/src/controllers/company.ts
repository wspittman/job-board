import { batch } from "dry-utils-async";
import { llm } from "../ai/llm.ts";
import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { RefreshJobsOptions } from "../models/clientModels.ts";
import type { CompanyKey, CompanyKeys } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { AsyncQueue } from "../utils/asyncQueue.ts";
import { logProperty } from "../utils/telemetry.ts";
import { refreshJobsForCompany } from "./job.ts";
import { metadataCompanyExecutor, metadataJobExecutor } from "./metadata.ts";

const companyInfoQueue = new AsyncQueue(
  "RefreshCompanyInfo",
  refreshCompanyInfo,
  metadataCompanyExecutor
);
const companyJobQueue = new AsyncQueue(
  "RefreshJobsForCompany",
  refreshJobsForCompany,
  metadataJobExecutor,
  3
);

/**
 * Adds a single company to the database if it doesn't exist
 * @param key - Company identifier containing id and ATS type
 * @returns Promise resolving when company is added
 */
export async function addCompany(key: CompanyKey) {
  await addCompanyInternal(key);
  companyInfoQueue.add([key]);
}

/**
 * Adds multiple companies to the database
 * @param param0 - Object containing array of company IDs and ATS type
 * @returns Promise resolving when all companies are added
 */
export async function addCompanies({ ids, ats }: CompanyKeys) {
  const keys = ids.map((id) => ({ id, ats }));
  await batch("AddCompanies", keys, addCompanyInternal);
  companyInfoQueue.add(keys);
}

/**
 * Removes a company and all its associated jobs from the database
 * @param key - Company identifier containing id and ATS type
 * @returns Promise resolving when company and its jobs are removed
 */
export async function removeCompany(key: CompanyKey) {
  const companyId = key.id;
  const jobIds = await db.job.getIds(companyId);
  await db.company.remove(key);
  metadataCompanyExecutor.call();
  if (jobIds.length) {
    await batch("RemoveCompanyJobs", jobIds, (id) =>
      db.job.remove({ id, companyId })
    );
    metadataJobExecutor.call();
  }
}

export async function refreshCompanies() {
  const keys = await db.company.getKeys();
  companyInfoQueue.add(keys);
}

/**
 * Refreshes jobs for specified companies and updates metadata
 * @param param0 - Options for refreshing jobs including ATS type, company ID, and age threshold
 * @returns Promise resolving when jobs are refreshed and metadata is updated
 */
export async function refreshJobs({
  ats,
  companyId,
  replaceJobsOlderThan,
}: RefreshJobsOptions) {
  let keys: (CompanyKey & { replaceJobsOlderThan?: number })[];

  if (companyId && ats) {
    const company = await db.company.get({ id: companyId, ats });
    if (!company) {
      throw new AppError("Company not found");
    }
    keys = [{ id: companyId, ats }];
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

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const { item: company } = await ats.getCompany(key);
  if (!company) return;

  await db.company.upsert(company);
  // Don't add to companyInfoQueue here, we want the caller to do it so they can batch
}

async function refreshCompanyInfo(key: CompanyKey) {
  logProperty("Input", key);
  const company = await ats.getCompany(key, true);
  if (company.context && (await llm.fillCompanyInfo(company))) {
    await db.company.upsert(company.item);
  }
}
