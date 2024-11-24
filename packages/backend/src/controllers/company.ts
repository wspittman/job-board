import { getAtsCompany } from "../ats/ats";
import { deleteItem, getAllByPartitionKey, getItem, upsert } from "../db/db";
import type { ATS, Company, CompanyKey, CompanyKeys } from "../db/models";
import {
  validateAts,
  validateCompanyKey,
  validateCompanyKeys,
} from "../db/validation";

const container = "company";

export async function getCompany(key: CompanyKey) {
  return readCompany(validateCompanyKey("getCompany", key));
}

export async function getCompanies(ats: ATS) {
  validateAts("getCompanies", ats);
  return readCompanies(ats);
}

export async function addCompany(key: CompanyKey) {
  return addCompanyInternal(validateCompanyKey("addCompany", key));
}

export async function addCompanies(keys: CompanyKeys) {
  const { ids, ats } = validateCompanyKeys("addCompanies", keys);
  await Promise.all(ids.map((id) => addCompanyInternal({ id, ats })));
}

export async function removeCompany(key: CompanyKey) {
  return deleteCompany(validateCompanyKey("removeCompany", key));
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
