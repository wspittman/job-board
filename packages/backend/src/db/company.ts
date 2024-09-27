import { AppError } from "../AppError";
import { ATS } from "../ats/ats";
import { getAllByPartitionKey, upsert } from "./db";

/**
 * - id: The ATS company name
 * - pKey: ats
 */
export interface Company {
  id: string;
  ats: ATS;
  name: string;
  description: string;
}

export type CompanyInput = Pick<Company, "id" | "ats">;

export function validateCompanyInput({ id, ats }: CompanyInput): CompanyInput {
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
  return (await getAllByPartitionKey<Company>("company", ats)).resources;
}
