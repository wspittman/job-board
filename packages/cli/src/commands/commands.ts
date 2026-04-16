import { runApiCommand, getApiUsage } from "../api/commands.ts";
import type { RuntimeOptions } from "../api/types.ts";
import { CommandError, type Command } from "../types.ts";
import { blogBuild } from "./blogBuild.ts";
import { evals } from "./eval.ts";
import { fetchInput, fetchInputMany } from "./fetchInput.ts";
import { jobCounts } from "./jobCounts.ts";
import { playground } from "./playground.ts";
import { asArray } from "../utils/utils.ts";

const registry: Record<string, Command> = {
  "data:fetch-input": fetchInput,
  "data:fetch-input-many": fetchInputMany,
  "eval:run": evals,
  "stats:job-counts": jobCounts,
  "exp:playground": playground,
  "content:build-blog": blogBuild,
};

export async function runCommand(
  name = "",
  args: string[] = [],
  runtime: RuntimeOptions,
): Promise<void> {
  const cmd = registry[name];

  if (cmd) {
    cmd.prerequisite?.();
    await cmd.run(args);
    return;
  }

  const handledByApi = await runApiCommand(name, args, { runtime });

  if (!handledByApi) {
    throw new CommandError(`Invalid Command "${name}"`);
  }
}

export function getUsage(indent = ""): string[] {
  const general = Object.entries(registry).flatMap(([name, cmd]) =>
    asArray(cmd.usage()).map(
      (line, index) =>
        `${index === 0 ? `${indent}${name} ` : `${indent}${" ".repeat(name.length + 1)}`}${line}`,
    ),
  );

  return [...general, ...getApiUsage(indent)];
}
