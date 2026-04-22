import { logger } from "dry-utils-logger";
import process from "node:process";
import { apiCommands } from "./api/commands.ts";
import { atsCommands } from "./ats/commands.ts";
import { e2e } from "./e2e/commands.ts";
import { evals } from "./eval/eval.ts";
import { html } from "./html/html.ts";
import { playground } from "./playground/playground.ts";
import { type Command } from "./types.ts";
import { runCommand } from "./utils/utils.ts";

const cmd: Command = {
  usage: () => "<COMMAND> <ARGS>",
  subCommands: {
    api: apiCommands,
    ats: atsCommands,
    e2e,
    evals,
    html,
    playground,
  },
};

async function main() {
  const args = process.argv.slice(2);
  logger.info(`Running CLI with args`, args);
  await runCommand("npm run cli --", cmd, args);
}

main().catch((err) => {
  process.exitCode = 1;
  logger.error("Main:", err);
});
