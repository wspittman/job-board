import { ats } from "../ats/ats";
import { db } from "../db/db";
import { RefreshJobsOptions } from "../types/clientModels";
import type { CompanyKey, CompanyKeys } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { asyncBatch } from "../utils/asyncBatch";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";
import { refreshJobsForCompany } from "./job";
import { metadataExecutor } from "./metadata";

const companyInfoQueue = new AsyncQueue(
  "RefreshCompanyInfo",
  refreshCompanyInfo,
  metadataExecutor
);
const companyJobQueue = new AsyncQueue(
  "RefreshJobsForCompany",
  refreshJobsForCompany,
  metadataExecutor,
  3
);

/**
 * Adds a single company to the database if it doesn't exist
 * @param key - Company identifier containing id and ATS type
 * @returns Promise resolving when company is added
 */
export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(key);
}

/**
 * Adds multiple companies to the database
 * @param param0 - Object containing array of company IDs and ATS type
 * @returns Promise resolving when all companies are added
 */
export async function addCompanies({ ids, ats }: CompanyKeys) {
  return asyncBatch("AddCompanies", ids, (id) =>
    addCompanyInternal({ id, ats })
  );
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
  return asyncBatch("RemoveCompanyJobs", jobIds, (id) =>
    db.job.remove({ id, companyId })
  );
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

  return db.company.upsert(company);
}

async function refreshCompanyInfo(key: CompanyKey) {
  logProperty("Input", key);
  const companyContext = await ats.getCompany(key, true);
  // TBD after Data Model update
  throw new Error("Not implemented");
}
