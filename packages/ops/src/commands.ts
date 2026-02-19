import { e2e } from "./e2e/e2e.ts";
import { fetcher } from "./fetcher.ts";
import { atsTypes, CommandError, type ATS, type Command } from "./types.ts";
import { asArray } from "./utils.ts";

function validateAts(ats?: string): ATS {
  const vATS = ats?.toLowerCase() as ATS;

  if (!vATS || !atsTypes.includes(vATS)) {
    throw new CommandError("Invalid argument: ATS");
  }

  return vATS;
}

function validateIds(name: string, ...ids: (string | undefined)[]): string[] {
  const validIds = ids
    .map((id) => id?.replace(",", "").trim() || "")
    .filter((id) => !!id);

  if (!validIds.length) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return validIds;
}

const addCompanies: Command = {
  usage: () => "<ATS> <COMPANY_ID> [...COMPANY_ID]",
  run: async ([ats, ...companyIds]: string[]): Promise<void> => {
    ats = validateAts(ats);
    companyIds = validateIds("COMPANY_ID", ...companyIds);

    console.log(`Adding ${companyIds.length} companies from ${ats}`);
    const body = { ats, ids: companyIds };
    const result = await fetcher("PUT", "companies", { body });
    console.log("Success", result);
  },
};

const deleteJob: Command = {
  usage: () => "<COMPANY_ID> <JOB_ID>",
  run: async ([companyId, jobId]: string[]): Promise<void> => {
    [companyId] = validateIds("COMPANY_ID", companyId);
    [jobId] = validateIds("JOB_ID", jobId);

    console.log(`Deleting job ${jobId} for company ${companyId}`);
    const body = { id: jobId, companyId };
    const result = await fetcher("DELETE", "job", { body });
    console.log("Success", result);
  },
};

const ignoreJob: Command = {
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async ([ats, companyId, jobId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);
    [jobId] = validateIds("JOB_ID", jobId);

    console.log(`Ignoring job ${jobId} for company ${companyId} from ${ats}`);
    const body = { ats, companyId, jobId };
    const result = await fetcher("DELETE", "company/job", { body });
    console.log("Success", result);
  },
};

const deleteCompany: Command = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    console.log(`Deleting company ${companyId} from ${ats}`);
    const body = { ats, id: companyId };
    const result = await fetcher("DELETE", "company", { body });
    console.log("Success", result);
  },
};

const syncCompanyJobs: Command = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    console.log(`Syncing jobs for company ${companyId} from ${ats}`);
    const body = { ats, id: companyId };
    const result = await fetcher("POST", "company/jobs/sync", { body });
    console.log("Success", result);
  },
};

const registry: Record<string, Command> = {
  addCompanies,
  deleteJob,
  ignoreJob,
  deleteCompany,
  syncCompanyJobs,
  e2e,
};

export async function runCommand(
  name = "",
  args: string[] = [],
): Promise<void> {
  const cmd = registry[name];

  if (!cmd) {
    throw new CommandError(`Invalid Command "${name}"`);
  }

  cmd.prerequisite?.();

  await cmd.run(args);
}

export function getUsage(indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, cmd]) => [
    ...asArray(cmd.usage()).map(
      (line, i) => `${i === 0 ? `${indent}${name} ` : `${indent}  `}${line}`,
    ),
  ]);
}
