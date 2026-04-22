import { logger } from "dry-utils-logger";
import { atsTypes, type ATS } from "../portal/pTypes.ts";
import { CommandError, type Command } from "../types.ts";

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

function commandUsage(cName: string, cmd: Command, indent: string): string[] {
  const usage = cmd.usage();
  let [title, ...rest] = Array.isArray(usage) ? usage : [usage];
  title = `${indent}${cName} ${title}`;
  rest = rest.map((line) => `${indent + "  "}${line}`);
  const cmdUsage = [title, ...rest];

  const subCommands = Object.entries(cmd.subCommands ?? {});
  const subCommandUsage = subCommands.flatMap(([name, subCmd]) => [
    "",
    ...commandUsage(name, subCmd, indent + "  "),
  ]);

  return [...cmdUsage, ...subCommandUsage];
}

function logCommandUsage(parent: string, cmd: Command): void {
  logger.info(["Usage:", ...commandUsage(parent, cmd, "  "), ""].join("\n"));
}

export async function runCommand(
  parent: string,
  cmd: Command,
  args: string[],
): Promise<void> {
  try {
    cmd.prerequisite?.();

    if (cmd.subCommands) {
      const [subCommand, ...subArgs] = args;
      const subCmd = cmd.subCommands[subCommand!];

      if (!subCmd) {
        logCommandUsage(parent, cmd);
        logger.error(`Invalid Command "${subCommand ?? ""}"`);
        return;
      }

      await runCommand(`${parent} ${subCommand}`, subCmd, subArgs);
    } else if (cmd.run) {
      await cmd.run(args);
    } else {
      throw new CommandError("No subCommand or run() defined for this command");
    }
  } catch (err) {
    if (err instanceof CommandError) {
      logCommandUsage(parent, cmd);
      logger.error("Command Error", err);
    } else {
      throw err;
    }
  }
}
