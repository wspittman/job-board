import { db } from "../db/db";
import type { ATS, CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { findCompanyInfo } from "./crawl";

export async function getCompany(key: CompanyKey) {
  return readCompany(key);
}

export async function getCompanies(ats: ATS) {
  const result = await readCompanies(ats);
  logProperty("GetCompanies_Count", result.length);
  return result;
}

export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(key);
}

export async function addCompanies({ ids, ats }: CompanyKeys) {
  await batchRun(ids, (id) => addCompanyInternal({ id, ats }), "AddCompanies");
}

export async function removeCompany(key: CompanyKey) {
  // TODO: Delete company's jobs also
  return deleteCompany(key);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await readCompany(key);
  if (exists) return;

  const company = await ats.createCompany(key);
  if (!company) return;

  await db.company.upsert(company);
  findCompanyInfo.add(key);
}

async function readCompany({ id, ats }: CompanyKey) {
  return db.company.getItem(id, ats);
}

async function readCompanies(ats: ATS) {
  return db.company.getAllByPartitionKey(ats);
}

async function deleteCompany({ id, ats }: CompanyKey) {
  return db.company.deleteItem(id, ats);
}
