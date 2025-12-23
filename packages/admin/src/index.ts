import process from "node:process";
import { CommandError, getUsage, runCommand } from "./commands.ts";
import { atsTypes } from "./types.ts";

function usageReminder() {
  console.log(
    [
      "Usage:",
      "  npm run admin -- <COMMAND> <ARGS>",
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
  await runCommand(command, args);
}

main().catch((err) => {
  if (err instanceof CommandError) {
    usageReminder();
  }
  console.error(err instanceof Error ? err.message : err);
  console.error();
  process.exitCode = 1;
});
