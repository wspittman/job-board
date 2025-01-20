import { getAtsCompany } from "../ats/ats";
import { db } from "../db/db";
import type { ATS, CompanyKey, CompanyKeys } from "../db/models";
import { logProperty } from "../utils/telemetry";

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
  await Promise.all(ids.map((id) => addCompanyInternal({ id, ats })));
}

export async function removeCompany(key: CompanyKey) {
  return deleteCompany(key);
}

async function addCompanyInternal({ id, ats }: CompanyKey) {
  const company = await getAtsCompany(ats, id);
  await db.company.upsert(company);
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
