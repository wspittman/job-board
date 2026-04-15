import {
  getUsage as getLabUsage,
  runCommand as runLabCommand,
} from "./lab/commands/commands.ts";
import {
  getUsage as getOpsUsage,
  runCommand as runOpsCommand,
} from "./ops/commands.ts";

function isInvalidCommandError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Invalid Command");
}

/**
 * Run a named command from either the legacy lab or ops command sets.
 */
export async function runCommand(
  name = "",
  args: string[] = [],
): Promise<void> {
  try {
    await runOpsCommand(name, args);
    return;
  } catch (error) {
    if (!isInvalidCommandError(error)) {
      throw error;
    }
  }

  await runLabCommand(name, args);
}

/**
 * Return command usage strings for CLI help.
 */
export function getUsage(indent = ""): string[] {
  return [...getOpsUsage(indent), ...getLabUsage(indent)];
}
