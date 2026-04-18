import { logger } from "dry-utils-logger";
import timers from "node:timers/promises";
import { fetchJobCount } from "../portal/pFuncs.ts";
import type { Command, Registry } from "../types.ts";
import {
  commandUsage,
  runCommand,
  validateAts,
  validateIds,
} from "../utils/utils.ts";

const counts: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async ([atsArg, ...companyIds]: string[]): Promise<void> => {
    const ats = validateAts(atsArg);
    companyIds = validateIds("COMPANY_IDs", ...companyIds);

    logger.info(`Get job counts for ${ats} companies`, companyIds);

    for (const companyId of companyIds) {
      try {
        const count = await fetchJobCount(ats, companyId);
        logger.info(`  ${companyId}: ${count}`);
      } catch (error) {
        logger.error(`  ${companyId}:`, error);
      }
      await timers.setTimeout(100); // Throttle requests
    }
  },
};

const registry: Registry = {
  counts,
};

export const atsCommands: Command = {
  usage: () => [
    "<SUBCOMMAND> <ARGS>",
    "",
    "Requests information from external ATS using backend code",
    ...commandUsage(registry),
  ],
  run: (args: string[]) => runCommand(registry, args),
};
