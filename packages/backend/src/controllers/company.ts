import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { CompanyKey, CompanyKeys } from "../types/dbModels";
import { batchRun } from "../utils/async";
import { AsyncQueue } from "../utils/asyncQueue";
import { refreshJobsForCompany } from "./job";

const companyInfoQueue = new AsyncQueue<CompanyKey>(refreshCompanyInfo);
const companyJobQueue = new AsyncQueue<CompanyKey>(refreshJobsForCompany);

export async function getCompany(key: CompanyKey) {
  return db.company.get(key);
}

export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(key);
}

export async function addCompanies({ ids, ats }: CompanyKeys) {
  return batchRun(ids, (id) => addCompanyInternal({ id, ats }), "AddCompanies");
}

export async function removeCompany(key: CompanyKey) {
  // TODO: Delete company's jobs also
  return db.company.remove(key);
}

export async function refreshCompanies() {
  // TODO: WithAsyncContext
  const keys = await db.company.getKeys();
  // TODO: How does metadata clearing fit in here?
  companyInfoQueue.addMany(keys);
}

// TODO: This should take in options: single company, timestamp for all before
export async function refreshJobs() {
  // TODO: WithAsyncContext
  const keys = await db.company.getKeys();
  // TODO: How does metadata clearing fit in here?
  companyJobQueue.addMany(keys);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.initCompany(key);
  if (!company) return;

  await db.company.upsert(company);
  companyInfoQueue.add(company);
}

async function refreshCompanyInfo(key: CompanyKey) {
  // TODO: WithAsyncContext
  const { company, context } = await ats.getCompany(key);
  // extracts into company object
  await llm.extractCompanyInfo(company, context);
  await db.company.upsert(company);

  //TODO: Update company metadata object
}
