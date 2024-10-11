import { AppError } from "../AppError";
import { getAts } from "../ats/ats";
import { deleteItem, getAllByPartitionKey, upsert } from "../db/db";
import type { ATS, Company } from "../db/models";

// #region Input Types and Validations

type CompanyInput = Pick<Company, "id" | "ats">;

interface CompaniesInput {
  ids: string[];
  ats: ATS;
}

const container = "company";

function validateCompanyInput({ id, ats }: CompanyInput): CompanyInput {
  if (!id) {
    throw new AppError("Company: id field is required");
  }

  validateAts(ats);

  return { id, ats };
}

function validateCompaniesInput({ ids, ats }: CompaniesInput): CompaniesInput {
  ids = (ids ?? []).filter(Boolean);

  if (!ids?.length) {
    throw new AppError("Company: ids field is required");
  }

  validateAts(ats);

  return { ids, ats };
}

function validateAts(ats: ATS) {
  if (!ats) {
    throw new AppError("Company: ats field is required");
  }

  if (!getAts(ats)) {
    throw new AppError("Company: ats field is invalid");
  }
}

// #endregion

export async function getCompanies(ats: ATS) {
  return readCompanies(ats);
}

export async function addCompany(input: CompanyInput) {
  return addCompanyInternal(validateCompanyInput(input));
}

export async function addCompanies(input: CompaniesInput) {
  const { ids, ats } = validateCompaniesInput(input);
  await Promise.all(ids.map((id) => addCompanyInternal({ id, ats })));
}

async function addCompanyInternal({ id, ats }: CompanyInput) {
  const company = await getAts(ats).getCompany(id);
  await updateCompany(company);
}

export async function removeCompany(input: CompanyInput) {
  return deleteCompany(validateCompanyInput(input));
}

// #region DB

async function readCompanies(ats: ATS) {
  return (await getAllByPartitionKey<Company>(container, ats)).resources;
}

async function updateCompany(company: Company) {
  upsert(container, company);
}

async function deleteCompany({ id, ats }: CompanyInput) {
  deleteItem(container, id, ats);
}

// #endregion
