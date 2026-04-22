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
  const usage = cmd.usage();
  let [title, ...rest] = Array.isArray(usage) ? usage : [usage];
  title = `${indent}${cName} ${title}`;
  rest = rest.map((line) => `${indent + "  "}${line}`);
  const cmdUsage = [title, ...rest];

  const subCommands = Object.entries(cmd.subCommands ?? {});
  const subCommandUsage = subCommands.flatMap(([name, subCmd]) => [
    "",
    ...commandUsage(name, subCmd, indent + "  "),
  ]);

  return [...cmdUsage, ...subCommandUsage];
}

function logCommandUsage(parent: string, cmd: Command): void {
  logger.info(["Usage:", ...commandUsage(parent, cmd, "  "), ""].join("\n"));
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
