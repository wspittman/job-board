import { logger } from "dry-utils-logger";
import timers from "node:timers/promises";
import {
  fetchCompany,
  fetchExampleJob,
  fetchJobCounts,
  fetchSpecificJob,
} from "../portal/pFuncs.ts";
import type { Command } from "../types.ts";
import { writeObj } from "../utils/fileUtils.ts";
import { validateCompanyArgs, validateJobArgs } from "../utils/utils.ts";

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

async function save(
  folder: "company" | "job",
  obj: object,
  ...keys: string[]
): Promise<void> {
  logger.info(`Saving ${keys.join("/")} to file`);
  const placeholder =
    folder === "job" ? { fillJobInfo: {} } : { fillCompanyInfo: {} };
  await writeObj(
    { ...obj, ...placeholder },
    { group: "eval", stage: "in", folder, file: keys },
  );
}

const counts: Command = {
  args: "<ATS> <COMPANY_ID[, ...]>",
  usage: "Get job counts for one or more companies",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Get job counts for ${ats} companies`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const { total, fresh } = await fetchJobCounts(ats, companyId);
      const pct = total ? ((fresh / total) * 100).toFixed(1) : "0";
      logger.info(`  ${companyId}: ${pct}% fresh, ${fresh} / ${total}`);
    });
  },
};

const company: Command = {
  args: "<ATS> <COMPANY_ID[, ...]>",
  usage: "Fetch and save company data",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Fetching ${ats} companies`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const result = await fetchCompany(ats, companyId);
      await save("company", result, ats, companyId);
    });
  },
};

const job: Command = {
  args: "<ATS> <COMPANY_ID[, ...]>",
  usage: "Fetch and save job data for a random job from each company",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Fetching ${ats} jobs`, companyIds);
    await runMany(companyIds, async (companyId) => {
      const result = await fetchExampleJob(ats, companyId);
      if (result) {
        await save("job", result, ats, companyId, result.item.id);
      } else {
        logger.info("No jobs for company", companyId);
      }
    });
  },
};

const exactJob: Command = {
  args: "<ATS> <COMPANY_ID> <JOB_ID>",
  usage: "Fetch and save a job data for a specific job",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId, jobId } = validateJobArgs(args);

    logger.info(`Fetching job ${ats}/${companyId}/${jobId}`);
    const result = await fetchSpecificJob(ats, companyId, jobId);
    await save("job", result, ats, companyId, jobId);
  },
};

export const atsCommands: Command = {
  args: "<SUBCOMMAND> <ARGS>",
  usage: "Requests information from external ATS using backend code",
  subCommands: {
    counts,
    company,
    job,
    exactJob,
  },
};
