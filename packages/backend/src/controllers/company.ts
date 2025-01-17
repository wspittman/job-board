import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { CompanyKey, CompanyKeys } from "../types/dbModels";
import { asyncBatch } from "../utils/asyncBatch";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";
import { refreshJobsForCompany } from "./job";

const companyInfoQueue = new AsyncQueue<CompanyKey>(
  "refreshCompanyInfo",
  refreshCompanyInfo
);
const companyJobQueue = new AsyncQueue<CompanyKey>(
  "refreshJobsForCompany",
  refreshJobsForCompany
);

export async function getCompany(key: CompanyKey) {
  return db.company.get(key);
}

export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(key);
}

export async function addCompanies({ ids, ats }: CompanyKeys) {
  return asyncBatch("AddCompanies", ids, (id) =>
    addCompanyInternal({ id, ats })
  );
}

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
  // TODO: How does metadata clearing fit in here?
  companyInfoQueue.addMany(keys);
}

// TODO: This should take in options: single company, timestamp for all before
export async function refreshJobs() {
  const keys = await db.company.getKeys();
  // TODO: How does metadata clearing fit in here?
  companyJobQueue.addMany(keys);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.getBasicCompany(key);
  if (!company) return;

  await db.company.upsert(company);
  companyInfoQueue.add(company);
}

async function refreshCompanyInfo(key: CompanyKey) {
  logProperty("Input", key);
  const companyContext = await ats.getCompany(key);
  // extracts into company object
  await llm.fillCompanyInfo(companyContext);
  await db.company.upsert(companyContext.item);

  //TODO: Update company metadata object
}
