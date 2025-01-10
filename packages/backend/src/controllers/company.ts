import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { ATS, CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { queueCompanyInfo } from "./crawl";

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

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.companyInit(key);
  if (!company) return;

  await db.company.upsert(company);
  queueCompanyInfo(key);
}
