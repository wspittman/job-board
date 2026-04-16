import { logger } from "dry-utils-logger";
import process from "node:process";
import { parseCommandLine } from "./core/flags.ts";
import { runCommand, usageLines } from "./commands/registry.ts";
import {
  atsTypes,
  CommandError,
  dataModelTypes,
  llmActionTypes,
} from "./shared/types.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS> [--flags]",
      "",
      "  COMMAND:",
      ...usageLines("    "),
      "",
      "  COMMON ARGUMENTS:",
      `    DATA_MODEL: ${dataModelTypes.join("|")}`,
      `    ATS: ${atsTypes.join("|")}`,
      `    LLM_ACTION: ${llmActionTypes.join("|")}`,
      "",
      "  SAFETY FLAGS FOR MUTATIONS:",
      "    --apply         Execute mutating command (required)",
      "    --env           local|prod (default: local)",
      "    --yes-prod      Required confirmation for production mutations",
      "",
    ].join("\n"),
  );
}

async function main() {
  const { commandName, args, flags } = parseCommandLine(process.argv.slice(2));

  if (!commandName || flags.help === true) {
    usageReminder();
    return;
  }

  logger.info(`Running command "${commandName}"`, { args, flags });
  await runCommand({ commandName, args, flags });
}

main().catch((error) => {
  if (error instanceof CommandError) {
    usageReminder();
  }
  logger.error("Main:", error);
  process.exitCode = 1;
});
