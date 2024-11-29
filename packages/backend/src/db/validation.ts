import { AppError } from "../AppError";
import type { ATS, CompanyKey, CompanyKeys, JobKey } from "./models";

export function validateAts(prefix: string, ats: ATS) {
  if (!ats) {
    throw new AppError(`${prefix}: ats field is required`);
  }

  if (ats !== "greenhouse" && ats !== "lever") {
    throw new AppError(`${prefix}: ats field is invalid`);
  }
}

export function validateCompanyKey(
  prefix: string,
  key: CompanyKey
): CompanyKey {
  const { id, ats } = key ?? {};

  if (!id) {
    throw new AppError(`${prefix}: Company id field is required`);
  }

  validateAts(prefix, ats);

  return { id, ats };
}

export function validateCompanyKeys(
  prefix: string,
  keys: CompanyKeys
): CompanyKeys {
  const { ids = [], ats } = keys ?? {};
  const filteredIds = ids.filter(Boolean);

  if (!filteredIds?.length) {
    throw new AppError(`${prefix}: Company ids field is required`);
  }

  validateAts(prefix, ats);

  return { ids: filteredIds, ats };
}

export function validateJobKey(prefix: string, key: JobKey): JobKey {
  const { id, companyId } = key ?? {};

  if (!id) {
    throw new AppError(`${prefix}: Job id field is required`);
  }

  if (!companyId) {
    throw new AppError(`${prefix}: Job companyId field is required`);
  }

  if (id.length > 100 || companyId.length > 100) {
    throw new AppError(`${prefix}: Job id or companyId field is too long`);
  }

  return { id, companyId };
}
