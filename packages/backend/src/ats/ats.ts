import type { Company, CompanyInput } from "../db/company";
import { getGreenhouseCompany, getGreenhouseJobs } from "./greenhouse";
import { getLeverCompany, getLeverJobs } from "./lever";

export enum ATS {
  GREENHOUSE = "greenhouse",
  LEVER = "lever",
}

export async function fillCompanyInput(
  company: CompanyInput
): Promise<Company> {
  switch (company.ats) {
    case ATS.GREENHOUSE:
      return getGreenhouseCompany(company);
    case ATS.LEVER:
      return getLeverCompany(company);
  }
}

export async function getAtsJobs(company: Company) {
  switch (company.ats) {
    case ATS.GREENHOUSE:
      return getGreenhouseJobs(company);
    case ATS.LEVER:
      return getLeverJobs(company);
  }
}
