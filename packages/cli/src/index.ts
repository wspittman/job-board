import { logger } from "dry-utils-logger";
import process from "node:process";
import {
  getUsage as getLabUsage,
  labCommandNames,
  runCommand as runLabCommand,
} from "./commands/commands.ts";
import {
  getUsage as getOpsUsage,
  opsCommandNames,
  runCommand as runOpsCommand,
} from "./ops/commands.ts";
import {
  atsTypes as opsAtsTypes,
  CommandError as OpsCommandError,
} from "./ops/types.ts";
import { atsTypes as labAtsTypes, dataModelTypes } from "./portal/pTypes.ts";
import { CommandError as LabCommandError } from "./types.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      ...getLabUsage("    "),
      ...getOpsUsage("    "),
      "",
      "  COMMON ARGUMENTS:",
      `    DATA_MODEL: ${dataModelTypes.join("|")}`,
      `    ATS: ${Array.from(new Set([...labAtsTypes, ...opsAtsTypes])).join("|")}`,
      "",
    ].join("\n"),
  );
}

async function main() {
  const [command = "", ...args] = process.argv.slice(2);
  logger.info(`Running command "${command}"`, args);

  if (labCommandNames.includes(command)) {
    await runLabCommand(command, args);
    return;
  }

  if (opsCommandNames.includes(command)) {
    await runOpsCommand(command, args);
    return;
  }

  throw new LabCommandError(`Invalid Command "${command}"`);
}

main().catch((err) => {
  if (err instanceof LabCommandError || err instanceof OpsCommandError) {
    usageReminder();
  }
  logger.error("Main:", err);
  process.exitCode = 1;
});
