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
  await Promise.all(ids.map((id) => addCompanyInternal({ id, ats })));
}

export async function removeCompany(key: CompanyKey) {
  const companyKey = validateCompanyKey("removeCompany", key);
  logProperty("RemoveCompany_Key", companyKey);
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
  return upsert(container, company);
}

async function deleteCompany({ id, ats }: CompanyKey) {
  return deleteItem(container, id, ats);
}

// #endregion
