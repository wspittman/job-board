import { logger } from "dry-utils-logger";
import timers from "node:timers/promises";
import { writeInFile } from "../eval/evalFiles.ts";
import {
  fetchInput as fetchInputPortal,
  validateAts,
  validateDataModel,
} from "../portal/pFuncs.ts";
import { CommandError, type Command } from "../types.ts";
import { validateIds } from "../utils/utils.ts";

export const fetchInput: Command = {
  usage: () => "<DATA_MODEL> <ATS> <COMPANY_ID> [JOB_ID]",
  run,
};

export const fetchInputMany: Command = {
  usage: () => "<DATA_MODEL> <ATS> <COMPANY_ID[, ...]>",
  run: runMany,
};

async function run([
  dataModelArg,
  atsArg,
  companyId,
  jobId,
]: string[]): Promise<void> {
  const dataModel = validateDataModel(dataModelArg);
  const ats = validateAts(atsArg);

  if (!companyId) {
    throw new CommandError("Invalid argument: COMPANY_ID");
  }

  const result = await fetchInputPortal(dataModel, ats, companyId, jobId);
  const id = dataModel === "job" ? result.item.id : "";
  await writeInFile(result, dataModel, ats, companyId, id);
}

async function runMany([
  dataModelArg,
  atsArg,
  ...companyArgs
]: string[]): Promise<void> {
  const dataModel = validateDataModel(dataModelArg);
  const ats = validateAts(atsArg);
  const companyIds = validateIds("COMPANY_IDs", companyArgs);

  logger.info(
    `Fetch ${dataModel} input for ${companyIds.length} ${ats} companies...`,
  );

  for (const companyId of companyIds) {
    const result = await fetchInputPortal(dataModel, ats, companyId);
    const id = dataModel === "job" ? result.item.id : "";
    await writeInFile(result, dataModel, ats, companyId, id);
    process.stdout.write(".");
    await timers.setTimeout(100); // Throttle requests
  }
}
