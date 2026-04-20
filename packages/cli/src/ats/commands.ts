import { logger } from "dry-utils-logger";
import timers from "node:timers/promises";
import { fetchCompany, fetchJob, fetchJobCount } from "../portal/pFuncs.ts";
import type { Command, Registry } from "../types.ts";
import {
  commandUsage,
  runCommand,
  validateCompanyArgs,
  validateJobArgs,
} from "../utils/utils.ts";

async function runMany(
  ids: string[],
  fn: (id: string) => Promise<void>,
): Promise<void> {
  for (const id of ids) {
    try {
      await fn(id);
    } catch (error) {
      logger.error(`  ${id}:`, error);
    }
    // Throttle requests
    await timers.setTimeout(100);
  }
}

const counts: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Get job counts for ${ats} companies`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const count = await fetchJobCount(ats, companyId);
      logger.info(`  ${companyId}: ${count}`);
    });
  },
};

const company: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Fetching ${ats} companies`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const result = await fetchCompany(ats, companyId);
      // temp, replace with write file in a few
      logger.info(`  ${companyId}`, result.item);
    });
  },
};

const job: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Fetching ${ats} jobs`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const result = await fetchJob(ats, companyId);
      // temp, replace with write file in a few
      logger.info(`  ${companyId}`, result.item);
    });
  },
};

const exactJob: Command = {
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId, jobId } = validateJobArgs(args);

    logger.info(`Fetching job ${ats}/${companyId}/${jobId}`);
    const result = await fetchJob(ats, companyId, jobId);
    // temp, replace with write file in a few
    logger.info(`  ${companyId}/${jobId}`, result.item);
  },
};

const registry: Registry = {
  counts,
  company,
  job,
  exactJob,
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
