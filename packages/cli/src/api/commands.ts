import { logger } from "dry-utils-logger";
import { type Command, type ENV, type Registry } from "../types.ts";
import { apiCall } from "../utils/http.ts";
import {
  commandUsage,
  runCommand,
  validateCompanyArgs,
  validateJobArgs,
} from "../utils/utils.ts";

const addCompany = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Adding ${ats} companies`, companyIds);
    const body = { ats, ids: companyIds };
    const result = await apiCall("PUT", "companies", { body, env });
    logger.info("Done", result);
  },
});

const deleteCompany = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId } = validateCompanyArgs(args);

    logger.info(`Deleting ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await apiCall("DELETE", "company", { body, env });
    logger.info("Done", result);
  },
});

const ignoreJob = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId, jobId } = validateJobArgs(args);

    logger.info(`Ignoring ${ats}/${companyId}/${jobId}`);
    const body = { ats, companyId, jobId };
    const result = await apiCall("DELETE", "company/job", { body, env });
    logger.info("Done", result);
  },
});

const syncCompanyJobs = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID>",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId } = validateCompanyArgs(args);

    logger.info(`Syncing jobs for ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await apiCall("POST", "company/jobs/sync", { body, env });
    logger.info("Done", result);
  },
});

const registry: Registry = {
  addCompany: addCompany(),
  addCompanyProd: addCompany("prod"),
  ignoreJob: ignoreJob(),
  ignoreJobProd: ignoreJob("prod"),
  deleteCompany: deleteCompany(),
  deleteCompanyProd: deleteCompany("prod"),
  syncCompanyJobs: syncCompanyJobs(),
  syncCompanyJobsProd: syncCompanyJobs("prod"),
};

export const apiCommands: Command = {
  usage: () => [
    "<SUBCOMMAND> <ARGS>",
    "",
    "Local requires a running local server",
    "Prod requires a valid PROD_ADMIN_TOKEN",
    ...commandUsage(registry),
  ],
  run: (args: string[]) => runCommand(registry, args),
};
