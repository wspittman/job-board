import { AppError } from "../AppError";
import { getAts } from "../ats/ats";
import { getAllByPartitionKey, upsert } from "../db/db";
import type { ATS, Company } from "../db/models";

type CompanyInput = Pick<Company, "id" | "ats">;

function validateCompanyInput({ id, ats }: CompanyInput): CompanyInput {
  if (!id) {
    throw new AppError("Company: id field is required");
  }

  if (!ats) {
    throw new AppError("Company: ats field is required");
  }

  if (!getAts(ats)) {
    throw new AppError("Company: ats field is invalid");
  }

  return { id, ats };
}

export async function createCompany(input: CompanyInput) {
  const { id, ats } = validateCompanyInput(input);

  const company = await getAts(ats).getCompany(id);

  await addCompany(company);
}

async function addCompany(company: Company) {
  upsert("company", company);
}

export async function getCompanies(ats: ATS) {
  return (await getAllByPartitionKey<Company>("company", ats)).resources;
}
