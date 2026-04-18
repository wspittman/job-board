import { logger } from "dry-utils-logger";
import process from "node:process";
import { apiCommands } from "./api/commands.ts";
import { atsTypes } from "./portal/pTypes.ts";
import { CommandError, type Registry } from "./types.ts";
import { commandUsage, runCommand } from "./utils/utils.ts";

const registry: Registry = {
  api: apiCommands,
};

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      ...commandUsage(registry, "    "),
      "",
      "  COMMON ARGUMENTS:",
      `    ATS: ${atsTypes.join("|")}`,
      "",
    ].join("\n"),
  );
}

async function main() {
  const args = process.argv.slice(2);
  logger.info(`Running CLI with args`, args);
  await runCommand(registry, args);
}

main().catch((err) => {
  if (err instanceof CommandError) {
    usageReminder();
  } else {
    process.exitCode = 1;
  }
  logger.error("Main:", err);
});
