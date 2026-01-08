import {
  fetchInput as fetchInputPortal,
  validateAts,
  validateDataModel,
} from "../portal/pFuncs.ts";
import { CommandError, type Command } from "../types.ts";
import { writeObj } from "../utils/fileUtils.ts";

export const fetchInput: Command = {
  usage: () => "<DATA_MODEL> <ATS> <COMPANY_ID> [JOB_ID]",
  run,
};

async function run([
  dataModelArg,
  atsArg,
  companyId,
  jobId,
]: string[]): Promise<void> {
  const dataModel = validateDataModel(dataModelArg);
  const ats = validateAts(atsArg);

  if (!companyId || (dataModel === "job" && !jobId)) {
    throw new CommandError("Invalid argument: COMPANY_ID or JOB_ID");
  }

  const result = await fetchInputPortal(dataModel, ats, companyId, jobId);
  await writeObj(result, "Input", dataModel, ats, companyId, jobId!);
}
