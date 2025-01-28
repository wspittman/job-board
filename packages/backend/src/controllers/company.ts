import { ats } from "../ats/ats";
import { db } from "../db/db";
import { RefreshJobsOptions } from "../types/clientModels";
import type { CompanyKey, CompanyKeys } from "../types/dbModels";
import { AppError } from "../utils/AppError";
import { batchRun } from "../utils/async";
import { refreshJobsForCompany } from "./job";
import { renewMetadata } from "./metadata";

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
  const companyId = key.id;
  const jobIds = await db.job.getIds(companyId);
  await db.company.remove(key);
  return batchRun(
    jobIds,
    (id) => db.job.remove({ id, companyId }),
    "RemoveCompanyJobs"
  );
}

export async function refreshCompanies() {
  // To be further implemented in the AsyncQueue vs AsyncBatch updates
  throw new AppError("Not implemented");
}

export async function refreshJobs({
  ats,
  companyId,
  replaceJobsOlderThan,
}: RefreshJobsOptions) {
  let keys: (CompanyKey & { replaceJobsOlderThan?: number })[];

  if (companyId && ats) {
    keys = [{ id: companyId, ats }];
  } else if (ats) {
    const ids = await db.company.getIds(ats);
    keys = ids.map((id) => ({ id, ats }));
  } else {
    keys = await db.company.getKeys();
  }

  if (replaceJobsOlderThan) {
    keys = keys.map((key) => ({ ...key, replaceJobsOlderThan }));
  }

  await batchRun(keys, refreshJobsForCompany, "RefreshJobs");
  return renewMetadata();
}

async function addCompanyInternal(key: CompanyKey) {
  const exists = await db.company.get(key);
  if (exists) return;

  const company = await ats.getCompany(key);
  if (!company) return;

  await db.company.upsert(company);
}
