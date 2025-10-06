import {
  atsTypes,
  dataModelTypes,
  fetchInput,
  isValidAts,
  isValidDataModel,
} from "./src/portal/pFuncs.ts";
import { writeObj } from "./src/utils/fileUtils.ts";

function usageReminder() {
  console.error(
    "Usage: npm run eval-fetch-input -- dataModel atsType <companyId> [jobId]\n" +
      `  dataModel: ${dataModelTypes.join("|")}\n` +
      `  atsType: ${atsTypes.join("|")}\n`
  );
}

async function run() {
  const args = process.argv.slice(2);
  const [dataModelArg, atsArg, companyId, jobId] = args;
  const dataModel = dataModelArg?.toLowerCase();
  const ats = atsArg?.toLowerCase();

  if (
    !isValidDataModel(dataModel) ||
    !isValidAts(ats) ||
    !companyId ||
    (dataModel === "job" && !jobId)
  ) {
    usageReminder();
    return;
  }

  const result = await fetchInput(dataModel, ats, companyId, jobId);
  await writeObj(result, "Input", dataModel, ats, companyId, jobId);
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
