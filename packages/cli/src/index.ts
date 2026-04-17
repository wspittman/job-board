import { logger } from "dry-utils-logger";
import process from "node:process";
import { atsTypes, dataModelTypes } from "./portal/pTypes.ts";
import { CommandError, type Command } from "./types.ts";
import { asArray } from "./utils/utils.ts";

const registry: Record<string, Command> = {};

function usageReminder() {
  const indent = "    ";
  const commandUsage = Object.entries(registry).flatMap(([name, cmd]) =>
    asArray(cmd.usage()).map(
      (line, i) => `${i === 0 ? `${indent}${name} ` : `${indent}  `}${line}`,
    ),
  );

  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS>",
      "",
      "  COMMAND:",
      ...commandUsage,
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

  if (!command) {
    throw new CommandError("No command provided");
  }

  const cmd = registry[command];

  if (!cmd) {
    throw new CommandError(`Invalid Command "${command}"`);
  }

  logger.info(`Running command "${command}"`, args);
  cmd.prerequisite?.();

  await cmd.run(args);
}

main().catch((err) => {
  if (err instanceof CommandError) {
    usageReminder();
  } else {
    process.exitCode = 1;
  }
  logger.error("Main:", err);
});
