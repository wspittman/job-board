import {
  fetchInput as fetchInputPortal,
  validateAts,
  validateDataModel,
} from "../portal/pFuncs.ts";
import { CommandError, type Command } from "../types/types.ts";
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

  if (!companyId) {
    throw new CommandError("Invalid argument: COMPANY_ID");
  }

  const result = await fetchInputPortal(dataModel, ats, companyId, jobId);
  const id = dataModel === "job" ? result.item.id : "";
  await writeObj(result, {
    group: "eval",
    stage: "in",
    folder: dataModel,
    file: [ats, companyId, id],
  });
}
