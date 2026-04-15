import {
  getUsage as getLabUsage,
  runCommand as runLabCommand,
} from "./lab/commands/commands.ts";
import {
  getUsage as getOpsUsage,
  runCommand as runOpsCommand,
} from "./ops/commands.ts";
import { CommandError as LabCommandError } from "./lab/types.ts";
import { CommandError as OpsCommandError } from "./ops/types.ts";

function getCommandNameFromUsageLine(line: string): string | undefined {
  if (line.startsWith("  ")) {
    return undefined;
  }

  return line.trim().split(/\s+/)[0];
}

const labCommands = new Set(
  getLabUsage()
    .map(getCommandNameFromUsageLine)
    .filter((value) => !!value),
);

const opsCommands = new Set(
  getOpsUsage()
    .map(getCommandNameFromUsageLine)
    .filter((value) => !!value),
);

/**
 * Returns true when an error is one of the legacy command errors.
 */
export function isCommandError(err: unknown): boolean {
  return err instanceof LabCommandError || err instanceof OpsCommandError;
}

/**
 * Runs a command supported by either legacy CLI package.
 */
export async function runCommand(
  name = "",
  args: string[] = [],
): Promise<void> {
  const inLab = labCommands.has(name);
  const inOps = opsCommands.has(name);

  if (inLab && inOps) {
    throw new Error(
      `Ambiguous command "${name}" exists in both lab and ops command sets`,
    );
  }

  if (inLab) {
    await runLabCommand(name, args);
    return;
  }

  if (inOps) {
    await runOpsCommand(name, args);
    return;
  }

  throw new LabCommandError(`Invalid Command "${name}"`);
}

/**
 * Returns merged command usage strings for CLI help text.
 */
export function getUsage(indent = ""): string[] {
  return [
    "# LAB COMMANDS",
    ...getLabUsage(indent),
    "",
    "# OPS COMMANDS",
    ...getOpsUsage(indent),
  ];
}
