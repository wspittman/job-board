import { db } from "../db/db";
import {
  validateAts,
  validateCompanyKey,
  validateCompanyKeys,
} from "../db/validation";
import type { ATS, CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { findCompanyInfo } from "./crawl";

export async function getCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("getCompany", key);
  logProperty("GetCompany_Key", companyKey);
  return readCompany(companyKey);
}

export async function getCompanies(ats: ATS) {
  validateAts("getCompanies", ats);
  logProperty("GetCompanies_ATS", ats);
  const result = await readCompanies(ats);
  logProperty("GetCompanies_Count", result.length);
  return result;
}

export async function addCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("addCompany", key);
  logProperty("AddCompany_Key", companyKey);
  return addCompanyInternal(companyKey);
}

export async function addCompanies(keys: CompanyKeys) {
  const { ids, ats } = validateCompanyKeys("addCompanies", keys);
  logProperty("AddCompanies._ATS", ats);
  logProperty("AddCompanies_Ids", ids);
  await batchRun(ids, (id) => addCompanyInternal({ id, ats }), "AddCompanies");
}

export async function removeCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("removeCompany", key);
  logProperty("RemoveCompany_Key", companyKey);
  // TODO: Delete company's jobs also
  return deleteCompany(companyKey);
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
