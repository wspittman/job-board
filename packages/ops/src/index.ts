import { logger } from "dry-utils-logger";
import process from "node:process";
import { getUsage, runCommand } from "./commands.ts";
import { atsTypes, CommandError } from "./types.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run ops -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      ...getUsage("    "),
      "",
      "  COMMON ARGUMENTS:",
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
  if (err instanceof CommandError) {
    usageReminder();
  }
  logger.error("Main:", err);
  process.exitCode = 1;
});
