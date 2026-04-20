import { atsTypes, type ATS } from "../portal/pTypes.ts";
import { CommandError, type Registry } from "../types.ts";

export function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

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

export function commandUsage(registry: Registry, indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, cmd]) => [
    "",
    ...asArray(cmd.usage()).map(
      (line, i) => `${i === 0 ? `${indent}${name} ` : `${indent}  `}${line}`,
    ),
  ]);
}

export async function runCommand(
  registry: Registry,
  [command, ...args]: string[],
): Promise<void> {
  if (!command) {
    throw new CommandError("No command provided");
  }
  const cmd = registry[command];

  if (!cmd) {
    throw new CommandError(`Invalid Command "${command}"`);
  }
  cmd.prerequisite?.();
  await cmd.run(args);
}
