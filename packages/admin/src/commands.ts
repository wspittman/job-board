import { fetcher } from "./fetcher.ts";
import { atsTypes } from "./types.ts";
import { asArray } from "./utils.ts";

interface Command {
  usage(): string | string[];
  run(args: string[]): Promise<void>;
}

function validateAts(ats?: string): string {
  ats = ats?.toLowerCase();

  if (!ats || !atsTypes.includes(ats)) {
    throw new CommandError("Invalid argument: ATS");
  }

  return ats;
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
    const result = await fetcher("companies", "PUT", { ats, ids: companyIds });
    console.log("Success", result);
  },
};

const deleteJob: Command = {
  usage: () => "<COMPANY_ID> <JOB_ID>",
  run: async ([companyId, jobId]: string[]): Promise<void> => {
    [companyId] = validateIds("COMPANY_ID", companyId);
    [jobId] = validateIds("JOB_ID", jobId);

    console.log(`Deleting job ${jobId} for company ${companyId}`);
    const result = await fetcher("job", "DELETE", { id: jobId, companyId });
    console.log("Success", result);
  },
};

const deleteCompany: Command = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    console.log(`Deleting company ${companyId} from ${ats}`);
    const result = await fetcher("company", "DELETE", { ats, id: companyId });
    console.log("Success", result);
  },
};

const registry: Record<string, Command> = {
  addCompanies,
  deleteJob,
  deleteCompany,
};

export class CommandError extends Error {}

export async function runCommand(
  name = "",
  args: string[] = [],
): Promise<void> {
  const cmd = registry[name];

  if (!cmd) {
    throw new CommandError(`Invalid Command "${name}"`);
  }

  return await cmd.run(args);
}

export function getUsage(indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, cmd]) => [
    ...asArray(cmd.usage()).map(
      (line, i) => `${i === 0 ? `${indent}${name} ` : `${indent}  `}${line}`,
    ),
  ]);
}
