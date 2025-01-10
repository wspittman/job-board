import { llm } from "../ai/llm";
import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { ATS, Company, CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { AsyncQueue } from "../utils/asyncQueue";
import { logProperty } from "../utils/telemetry";

const companyInfoQueue = new AsyncQueue<Company>(refreshCompanyInfo);

export async function getCompany(key: CompanyKey) {
  return db.company.get(key);
}

export async function getCompanies(ats: ATS) {
  const result = await db.company.getAll(ats);
  logProperty("GetCompanies_Count", result.length);
  return result;
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
  // Note: We currently fetch groups by partition key, but we could also use a single cross-partition query or change feed
  const companyLists = await Promise.all(ats.getAtsList().map(getCompanies));
  // TODO: How does metadata clearing fit in here?
  companyLists.forEach((companies) => companyInfoQueue.addMany(companies));
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.companyInit(key);
  if (!company) return;

  await db.company.upsert(company);
  companyInfoQueue.add(company);
}

async function refreshCompanyInfo(expired: Company) {
  // TODO: WithAsyncContext
  const { company, context } = await ats.companyInfo(expired);
  // extracts into company object
  await llm.extractCompanyInfo(company, expired, context);
  db.company.upsert(company);

  //TODO: Update company metadata object
}
