import { logger } from "dry-utils-logger";
import { type Command, type ENV, type Registry } from "../types.ts";
import { apiCall } from "../utils/http.ts";
import {
  commandUsage,
  runCommand,
  validateAts,
  validateIds,
} from "../utils/utils.ts";

const addCompany = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run: async ([ats, ...companyIds]: string[]): Promise<void> => {
    ats = validateAts(ats);
    companyIds = validateIds("COMPANY_ID", ...companyIds);

    logger.info(`Adding ${ats} companies`, companyIds);
    const body = { ats, ids: companyIds };
    const result = await apiCall("PUT", "companies", { body, env });
    logger.info("Done", result);
  },
});

const deleteCompany = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

    logger.info(`Deleting ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await apiCall("DELETE", "company", { body, env });
    logger.info("Done", result);
  },
});

const ignoreJob = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID> <JOB_ID>",
  run: async ([ats, companyId, jobId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);
    [jobId] = validateIds("JOB_ID", jobId);

    logger.info(`Ignoring ${ats}/${companyId}/${jobId}`);
    const body = { ats, companyId, jobId };
    const result = await apiCall("DELETE", "company/job", { body, env });
    logger.info("Done", result);
  },
});

const syncCompanyJobs = (env?: ENV): Command => ({
  usage: () => "<ATS> <COMPANY_ID>",
  run: async ([ats, companyId]: string[]): Promise<void> => {
    ats = validateAts(ats);
    [companyId] = validateIds("COMPANY_ID", companyId);

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
