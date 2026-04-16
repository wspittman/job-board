export interface ParseResult {
  commandName: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

/**
 * Parses argv into a command, positional args, and flags.
 */
export function parseCommandLine(argv: string[]): ParseResult {
  const [commandName = "", ...rest] = argv;
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]!;

    if (!token.startsWith("--")) {
      args.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = rest[i + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    i += 1;
  }

  return { commandName, args, flags };
}
