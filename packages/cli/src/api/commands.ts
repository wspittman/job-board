import { logger } from "dry-utils-logger";
import { type Command, type Registry } from "../types.ts";
import {
  commandUsage,
  runCommand,
  validateAts,
  validateIds,
} from "../utils/utils.ts";

// Placeholder
async function fetcher(a: string, b: string, c: unknown) {
  logger.info(`Placeholder Fetcher Call: ${a} ${b}`, c);
  return Promise.resolve({ success: true });
}

const addCompany: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async ([ats, ...companyIds]: string[]): Promise<void> => {
    ats = validateAts(ats);
    companyIds = validateIds("COMPANY_ID", ...companyIds);

    logger.info(`Adding ${ats} companies`, companyIds);
    const body = { ats, ids: companyIds };
    const result = await fetcher("PUT", "companies", { body });
    logger.info("Done", result);
  },
};

const deleteCompany: Command = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    logger.info(`Deleting ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await fetcher("DELETE", "company", { body });
    logger.info("Done", result);
  },
};

const ignoreJob: Command = {
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async ([ats, companyId, jobId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);
    [jobId] = validateIds("JOB_ID", jobId);

    logger.info(`Ignoring ${ats}/${companyId}/${jobId}`);
    const body = { ats, companyId, jobId };
    const result = await fetcher("DELETE", "company/job", { body });
    logger.info("Done", result);
  },
};

const syncCompanyJobs: Command = {
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    logger.info(`Syncing jobs for ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await fetcher("POST", "company/jobs/sync", { body });
    logger.info("Done", result);
  },
};

const registry: Registry = {
  addCompany,
  ignoreJob,
  deleteCompany,
  syncCompanyJobs,
};

export const apiCommands: Command = {
  usage: () => [
    "<SUBCOMMAND> <ARGS>",
    "These commands interact with the API and require a running server.",
    ...commandUsage(registry),
  ],
  run: (args: string[]) => runCommand(registry, args),
};
