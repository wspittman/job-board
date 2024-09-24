import { AppError } from "../AppError";
import { getContainer, queryFilters, upsert } from "./db";

export enum ATS {
  GREENHOUSE = "greenhouse",
  LEVER = "lever",
}

/**
 * - id: The ATS company name
 * - pKey: ats
 */
interface Company {
  id: string;
  ats: ATS;
}

export function validateCompany({ id, ats }: Company): Company {
  if (!id) {
    throw new AppError("Company: id field is required");
  }

  if (!ats) {
    throw new AppError("Company: ats field is required");
  }

  if (!Object.values(ATS).includes(ats)) {
    throw new AppError("Company: ats field is invalid");
  }

  return { id, ats };
}

export async function addCompany(company: Company) {
  upsert(getContainer("company"), company);
}

export async function getCompanies(ats: ATS) {
  return queryFilters<Company>(getContainer("company"), { ats });
}
