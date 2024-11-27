import { getAtsCompany } from "../ats/ats";
import { deleteItem, getAllByPartitionKey, getItem, upsert } from "../db/db";
import type { ATS, Company, CompanyKey, CompanyKeys } from "../db/models";
import {
  validateAts,
  validateCompanyKey,
  validateCompanyKeys,
} from "../db/validation";
import { logProperty } from "../utils/telemetry";

const container = "company";

export async function getCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("getCompany", key);
  logProperty("CompanyKey", companyKey);
  return readCompany(companyKey);
}

export async function getCompanies(ats: ATS) {
  validateAts("getCompanies", ats);
  logProperty("ATS", ats);
  const result = await readCompanies(ats);
  logProperty("CompanyCount", result.length);
  return result;
}

export async function addCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("addCompany", key);
  logProperty("CompanyKey", companyKey);
  return addCompanyInternal(companyKey);
}

export async function addCompanies(keys: CompanyKeys) {
  const { ids, ats } = validateCompanyKeys("addCompanies", keys);
  logProperty("ATS", ats);
  logProperty("CompanyIds", ids);
  await Promise.all(ids.map((id) => addCompanyInternal({ id, ats })));
}

export async function removeCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("removeCompany", key);
  logProperty("CompanyKey", companyKey);
  return deleteCompany(companyKey);
}

async function addCompanyInternal({ id, ats }: CompanyKey) {
  const company = await getAtsCompany(ats, id);
  await updateCompany(company);
}

// #region DB Operations

async function readCompany({ id, ats }: CompanyKey) {
  return getItem<Company>(container, id, ats);
}

async function readCompanies(ats: ATS) {
  return (await getAllByPartitionKey<Company>(container, ats)).resources;
}

async function updateCompany(company: Company) {
  upsert(container, company);
}

async function deleteCompany({ id, ats }: CompanyKey) {
  deleteItem(container, id, ats);
}

// #endregion
