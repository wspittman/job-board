import { logger } from "dry-utils-logger";
import process from "node:process";
import {
  getUsage as getApiUsage,
  runCommand as runApiCommand,
} from "./api/commands.ts";
import {
  getUsage as getLocalUsage,
  runCommand as runLocalCommand,
} from "./local/commands/commands.ts";
import {
  applyRuntimeFlags,
  getProductionConfirmationPhrase,
  resetRuntimeContext,
} from "./runtime.ts";

const GROUPS = ["api", "local"] as const;
type Group = (typeof GROUPS)[number];

function usageReminder() {
  logger.info(
    [
      "Usage:",
      "  npm run cli -- <GROUP> <COMMAND> <ARGS> [--flags]",
      "",
      "  GROUPS:",
      "    api   Call backend API commands (safe by default)",
      "    local Run local evaluation/data commands",
      "",
      "  API COMMANDS:",
      ...getApiUsage("    "),
      "",
      "  LOCAL COMMANDS:",
      ...getLocalUsage("    "),
      "",
      "  API SAFETY FLAGS:",
      "    --env <local|prod>                         (default: local)",
      "    --allow-production                         (required for --env prod)",
      `    --confirm-production ${getProductionConfirmationPhrase()} (required for --env prod)`,
      "    --dry-run                                  (show request without sending)",
      "",
    ].join("\n"),
  );
}

async function runGroup(group: Group, command: string, args: string[]) {
  if (group === "api") {
    await runApiCommand(command, args);
    return;
  }

  await runLocalCommand(command, args);
}

async function main() {
  resetRuntimeContext();

  const [group, command, ...restArgs] = process.argv.slice(2);

  if (!group || !GROUPS.includes(group as Group) || !command) {
    usageReminder();
    throw new Error("Expected <GROUP> and <COMMAND> arguments.");
  }

  const args = applyRuntimeFlags(restArgs);

  logger.info(`Running ${group} command "${command}"`, args);
  await runGroup(group as Group, command, args);
}

main().catch((err) => {
  usageReminder();
  logger.error("CLI failed:", err);
  process.exitCode = 1;
});
