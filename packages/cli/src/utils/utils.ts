import { atsTypes, type ATS } from "../portal/atsConsts.ts";
import { CommandError } from "../types.ts";

export function validateCompanyArgs([ats, ...companyIds]: string[]) {
  const ids = validateIds("COMPANY_IDs", companyIds);
  return {
    ats: validateAts(ats),
    companyId: ids[0]!,
    companyIds: ids,
  };
}

export function validateJobArgs([ats, companyId, jobId]: string[]) {
  return {
    ats: validateAts(ats),
    companyId: validateIds("COMPANY_ID", [companyId])[0]!,
    jobId: validateIds("JOB_ID", [jobId])[0]!,
  };
}

function validateAts(ats?: string): ATS {
  const vATS = ats?.toLowerCase() as ATS;

  if (!vATS || !atsTypes.includes(vATS)) {
    throw new CommandError("Invalid argument: ATS");
  }

  return vATS;
}

function validateIds(name: string, ids: (string | undefined)[]): string[] {
  const validIds = ids
    .map((id) => id?.replace(",", "").trim() || "")
    .filter((id) => !!id);

  if (!validIds.length) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return validIds;
}

export function validateFileName(name: string, fileName?: string): string {
  fileName = fileName?.trim() || "";

  if (!fileName || fileName.match(/[^a-zA-Z0-9_-]/)) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return fileName;
}
