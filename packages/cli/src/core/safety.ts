import { CommandError } from "../shared/types.ts";
import { config } from "./config.ts";

/**
 * Applies API safety controls for mutating commands.
 */
export function enforceMutationSafety(
  flags: Record<string, string | boolean>,
): void {
  const apply = flags.apply === true;

  if (!apply) {
    throw new CommandError(
      "Mutation blocked. Re-run with --apply to execute changes (preview mode is default).",
    );
  }

  const env = (flags.env ?? "local").toString();
  if (env === "prod") {
    if (flags["yes-prod"] !== true) {
      throw new CommandError(
        "Production mutation blocked. Re-run with --yes-prod to confirm intent.",
      );
    }

    if (!config.CLI_ALLOW_PROD) {
      throw new CommandError(
        "Production mutation blocked. Set CLI_ALLOW_PROD=true in environment to unlock.",
      );
    }
  }
}
