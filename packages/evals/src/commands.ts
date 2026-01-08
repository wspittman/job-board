import { evals } from "./commands/eval.ts";
import { fetchInput } from "./commands/fetchInput.ts";
import { jobCounts } from "./commands/jobCounts.ts";
import { playground } from "./commands/playground.ts";
import { CommandError, type Command } from "./types.ts";

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

const registry: Record<string, Command> = {
  evals,
  "fetch-input": fetchInput,
  playground,
  "job-counts": jobCounts,
};

/**
 * Run a named evaluation command.
 */
export async function runCommand(
  name = "",
  args: string[] = [],
): Promise<void> {
  const cmd = registry[name];

  if (!cmd) {
    throw new CommandError(`Invalid Command "${name}"`);
  }

  cmd.prerequisite?.();

  await cmd.run(args);
}

/**
 * Return command usage strings for CLI help.
 */
export function getUsage(indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, cmd]) =>
    asArray(cmd.usage()).map(
      (line, i) => `${i === 0 ? `${indent}${name} ` : `${indent}  `}${line}`,
    ),
  );
}
