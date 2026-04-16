import { apiCommands } from "./apiCommands.ts";
import { internalCommands } from "./internalCommands.ts";
import {
  CommandError,
  type CommandContext,
  type CommandDef,
} from "../shared/types.ts";

const registry: Record<string, CommandDef> = {
  ...apiCommands,
  ...internalCommands,
};

/**
 * Executes a registered command.
 */
export async function runCommand(ctx: CommandContext): Promise<void> {
  const command = registry[ctx.commandName];
  if (!command) {
    throw new CommandError(`Unknown command: ${ctx.commandName}`);
  }
  await command.run(ctx);
}

/**
 * Returns usage lines for all registered commands.
 */
export function usageLines(indent = ""): string[] {
  return Object.entries(registry).flatMap(([name, command]) => {
    const usage = command.usage();
    const lines = Array.isArray(usage) ? usage : [usage];
    return lines.map((line, index) => {
      const prefix = index === 0 ? `${indent}${name} ` : `${indent}  `;
      return `${prefix}${line}`;
    });
  });
}
