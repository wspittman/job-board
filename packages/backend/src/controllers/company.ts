import { ats } from "../ats/ats";
import { db } from "../db/db";
import type { ATS, Company, CompanyKey, CompanyKeys } from "../models/dbModels";
import { batchRun } from "../utils/async";
import { logProperty } from "../utils/telemetry";
import { queueCompanyInfo } from "./crawl";

export async function getCompany(key: CompanyKey) {
  return read(key);
}

export async function getCompanies(ats: ATS) {
  const result = await reads(ats);
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
  return del(key);
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await read(key);
  if (exists) return;

  const company = await ats.companyInit(key);
  if (!company) return;

  await upsert(company);
  queueCompanyInfo(key);
}

const upsert = (company: Company) => db.company.upsert(company);
const read = ({ id, ats }: CompanyKey) => db.company.getItem(id, ats);
const reads = (ats: ATS) => db.company.getAllByPartitionKey(ats);
const del = ({ id, ats }: CompanyKey) => db.company.deleteItem(id, ats);
