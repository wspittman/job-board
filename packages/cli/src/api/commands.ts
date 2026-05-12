import { logger } from "dry-utils-logger";
import { type Command, type ENV } from "../types.ts";
import { apiCall } from "../utils/http.ts";
import { validateCompanyArgs, validateJobArgs } from "../utils/utils.ts";

const addCompany = (env?: ENV): Command => ({
  args: "<ATS> <COMPANY_ID[, ...]>",
  usage: "Add companies",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyIds } = validateCompanyArgs(args);

    logger.info(`Adding ${ats} companies`, companyIds);
    const body = { ats, ids: companyIds };
    const result = await apiCall("PUT", "companies", { body, env });
    logger.info("Done", result);
  },
});

const deleteCompany = (env?: ENV): Command => ({
  args: "<ATS> <COMPANY_ID>",
  usage: "Delete a company",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId } = validateCompanyArgs(args);

    logger.info(`Deleting ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await apiCall("DELETE", "company", { body, env });
    logger.info("Done", result);
  },
});

const ignoreJob = (env?: ENV): Command => ({
  args: "<ATS> <COMPANY_ID> <JOB_ID>",
  usage: "Mark a job as ignored",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId, jobId } = validateJobArgs(args);

    logger.info(`Ignoring ${ats}/${companyId}/${jobId}`);
    const body = { ats, companyId, jobId };
    const result = await apiCall("DELETE", "company/job", { body, env });
    logger.info("Done", result);
  },
});

const syncCompanyJobs = (env?: ENV): Command => ({
  args: "<ATS> <COMPANY_ID>",
  usage: "Sync denormalized fields from a company to its jobs",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId } = validateCompanyArgs(args);

    logger.info(`Syncing jobs for ${ats}/${companyId}`);
    const body = { ats, id: companyId };
    const result = await apiCall("POST", "company/jobs/sync", { body, env });
    logger.info("Done", result);
  },
});

const refreshCompanyJobs = (env?: ENV): Command => ({
  args: "<ATS> <COMPANY_ID>",
  usage: "Refresh a company's jobs from the ATS",
  run: async (args: string[]): Promise<void> => {
    const { ats, companyId } = validateCompanyArgs(args);

    logger.info(`Refreshing jobs for ${ats}/${companyId}`);
    const body = { ats, companyId };
    const result = await apiCall("POST", "refresh/jobs/", { body, env });
    logger.info("Done", result);
  },
});

export const apiCommands: Command = {
  args: "<SUBCOMMAND> <ARGS>",
  usage: [
    "Make API calls for testing or operations purposes",
    "Local requires a running local server",
    "Prod requires a valid PROD_ADMIN_TOKEN",
  ],
  subCommands: {
    addCompany: addCompany(),
    addCompanyProd: addCompany("prod"),
    ignoreJob: ignoreJob(),
    ignoreJobProd: ignoreJob("prod"),
    deleteCompany: deleteCompany(),
    deleteCompanyProd: deleteCompany("prod"),
    syncCompanyJobs: syncCompanyJobs(),
    syncCompanyJobsProd: syncCompanyJobs("prod"),
    refreshCompanyJobs: refreshCompanyJobs(),
    refreshCompanyJobsProd: refreshCompanyJobs("prod"),
  },
};
