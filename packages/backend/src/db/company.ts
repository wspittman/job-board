import { AppError } from "../AppError";
import { ATS } from "../ats/ats";
import { queryFilters, upsert } from "./db";

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
  upsert("company", company);
}

export async function getCompanies(ats: ATS) {
  return queryFilters<Company>("company", { ats });
}
