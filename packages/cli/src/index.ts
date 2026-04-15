import { logger } from "dry-utils-logger";
import process from "node:process";
import { getUsage, isCommandError, runCommand } from "./commands.ts";
import { atsTypes } from "./ops/types.ts";
import { dataModelTypes } from "./lab/portal/pTypes.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      ...getUsage("    "),
      "",
      "  COMMON ARGUMENTS:",
      `    DATA_MODEL: ${dataModelTypes.join("|")}`,
      `    ATS: ${atsTypes.join("|")}`,
      "",
    ].join("\n"),
  );
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  logger.info(`Running command "${command}"`, args);
  await runCommand(command, args);
}

main().catch((err) => {
  if (isCommandError(err)) {
    usageReminder();
  }

  logger.error("Main:", err);
  process.exitCode = 1;
});
