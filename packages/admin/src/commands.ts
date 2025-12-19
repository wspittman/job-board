import { fetcher } from "./fetcher.ts";
import { atsTypes } from "./types.ts";
import { asArray } from "./utils.ts";

interface Command {
  usage(): string | string[];
  run(args: string[]): Promise<void>;
}

const addCompanies: Command = {
  usage: () => "<ATS_ID> <COMPANY_ID> [...COMPANY_ID]",

  run: async (args: string[]): Promise<void> => {
    let [ats, ...companyIds] = args;
    ats = ats?.toLowerCase() ?? "";
    companyIds = companyIds
      .map((id) => id.replace(",", "").trim())
      .filter((id) => !!id.length);

    if (!atsTypes.includes(ats) || !companyIds.length) {
      throw new CommandError("Invalid arguments");
    }

    console.log(`Adding ${companyIds.length} companies from ${ats}`);
    const result = await fetcher("companies", "PUT", { ats, ids: companyIds });
    console.log("Success", result);
  },
};

const deleteJob: Command = {
  usage: () => "<COMPANY_ID> <JOB_ID>",

  run: async (args: string[]): Promise<void> => {
    const [companyId, id] = args;

    if (!companyId || !id) {
      throw new CommandError("Invalid arguments");
    }

    console.log(`Deleting job ${id} for company ${companyId}`);
    const result = await fetcher("job", "DELETE", { id, companyId });
    console.log("Success", result);
  },
};

const deleteCompany: Command = {
  usage: () => "<ATS_ID> <COMPANY_ID>",

  run: async (args: string[]): Promise<void> => {
    const [atsInput, id] = args;

    const ats = atsInput?.toLowerCase() ?? "";

    if (!atsTypes.includes(ats) || !id) {
      throw new CommandError("Invalid arguments");
    }

    console.log(`Deleting company ${id} from ${ats}`);
    const result = await fetcher("company", "DELETE", { ats, id });
    console.log("Success", result);
  },
};

const registry: Record<string, Command> = {
  "add-companies": addCompanies,
  "delete-job": deleteJob,
  "delete-company": deleteCompany,
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
