import { logger } from "dry-utils-logger";
import process from "node:process";
import { getUsage, runCommand } from "./commands/commands.ts";
import { atsTypes, dataModelTypes, llmActionTypes } from "./portal/pTypes.ts";
import { CommandError } from "./types.ts";
import type { ExecutionProfile, RuntimeOptions } from "./api/types.ts";

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <COMMAND> <ARGS> [--profile=local|prod] [--confirm]",
      "",
      "Safety:",
      "  - The default profile is local.",
      "  - Mutating API commands require --confirm when --profile=prod.",
      "",
      "COMMAND:",
      ...getUsage("    "),
      "",
      "COMMON ARGUMENTS:",
      `    DATA_MODEL: ${dataModelTypes.join("|")}`,
      `    ATS: ${atsTypes.join("|")}`,
      `    LLM_ACTION: ${llmActionTypes.join("|")}`,
      "",
    ].join("\n"),
  );
}

function parseRuntimeOptions(args: string[]): {
  runtime: RuntimeOptions;
  command: string;
  commandArgs: string[];
} {
  let profile: ExecutionProfile = "local";
  let confirm = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--confirm") {
      confirm = true;
      continue;
    }

    if (arg.startsWith("--profile=")) {
      const value = arg.replace("--profile=", "").trim();

      if (value !== "local" && value !== "prod") {
        throw new CommandError(
          "Invalid argument: --profile must be local or prod",
        );
      }

      profile = value;
      continue;
    }

    positional.push(arg);
  }

  const [command = "", ...commandArgs] = positional;

  return {
    runtime: { profile, confirm },
    command,
    commandArgs,
  };
}

async function main() {
  const { runtime, command, commandArgs } = parseRuntimeOptions(
    process.argv.slice(2),
  );
  logger.info(`Running command "${command}"`, {
    commandArgs,
    profile: runtime.profile,
    confirm: runtime.confirm,
  });
  await runCommand(command, commandArgs, runtime);
}

main().catch((err) => {
  if (err instanceof CommandError) {
    usageReminder();
  }
  logger.error("Main:", err);
  process.exitCode = 1;
});
