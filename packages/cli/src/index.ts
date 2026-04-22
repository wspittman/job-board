import { logger } from "dry-utils-logger";
import process from "node:process";
import { apiCommands } from "./api/commands.ts";
import { atsCommands } from "./ats/commands.ts";
import { e2e } from "./e2e/commands.ts";
import { evals } from "./eval/eval.ts";
import { html } from "./html/html.ts";
import { playground } from "./playground/playground.ts";
import { CommandError, type Command } from "./types.ts";

function commandUsage(cName: string, cmd: Command, indent: string): string[] {
  const title = `${indent}${cName} ${cmd.args}`;
  const usageLines = Array.isArray(cmd.usage) ? cmd.usage : [cmd.usage];
  const subCommands = Object.entries(cmd.subCommands ?? {});
  const subCommandUsage = subCommands.flatMap(([name, subCmd]) => [
    "",
    ...commandUsage(name, subCmd, indent + "  "),
  ]);

  return [
    title,
    ...usageLines.map((line) => `${indent + "  "}${line}`),
    ...subCommandUsage,
  ];
}

// Don't log usage more than once
let usageLogged = false;

function logCommandUsage(parent: string, cmd: Command): void {
  if (usageLogged) return;
  logger.info(["Usage:", ...commandUsage(parent, cmd, "  "), ""].join("\n"));
  usageLogged = true;
}

export async function runCommand(
  parent: string,
  cmd: Command,
  args: string[],
): Promise<void> {
  try {
    cmd.prerequisite?.();

    if (cmd.subCommands) {
      const [subCommand, ...subArgs] = args;
      const subCmd = cmd.subCommands[subCommand!];

      if (!subCmd) {
        throw new CommandError(`Invalid Command "${subCommand ?? ""}"`);
      }

      await runCommand(`${parent} ${subCommand}`, subCmd, subArgs);
    } else if (cmd.run) {
      await cmd.run(args);
    } else {
      throw new CommandError("No subCommand or run() defined for this command");
    }
  } catch (err) {
    if (err instanceof CommandError) {
      logCommandUsage(parent, cmd);
    }
    throw err;
  }
}

const cmd: Command = {
  args: "<COMMAND> <ARGS>",
  usage: "General-purpose CLI for development and operational tasks",
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

  if (args[0] === "help") {
    logCommandUsage("npm run cli --", cmd);
    return;
  }

  logger.info(`Running CLI with args`, args);
  await runCommand("npm run cli --", cmd, args);
}

main().catch((err) => {
  process.exitCode = 1;
  logger.error("Main:", err);
});
