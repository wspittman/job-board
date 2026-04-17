import { logger } from "dry-utils-logger";
import process from "node:process";
import { atsTypes, dataModelTypes } from "./portal/pTypes.ts";
import { CommandError } from "./types.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      //...getUsage("    "),
      "",
      "  COMMON ARGUMENTS:",
      `    DATA_MODEL: ${dataModelTypes.join("|")}`,
      `    ATS: ${atsTypes.join("|")}`,
      "",
    ].join("\n"),
  );
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  logger.info(`Running command "${command}"`, args);
  //await runCommand(command, args);
  if (command === "testOK") {
    return Promise.resolve();
  }
  throw new CommandError("No commands implemented yet");
}

main().catch((err) => {
  if (err instanceof CommandError) {
    usageReminder();
  }
  logger.error("Main:", err);
  process.exitCode = 1;
});
