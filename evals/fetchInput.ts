import { ats } from "../packages/backend/src/ats/ats.ts";
import type { ATS } from "../packages/backend/src/types/dbModels.ts";
import { writeInputObj } from "./fileUtils.ts";

const args = process.argv.slice(2);
const [action, atsId, companyId, jobId] = args;
const actionTypes = ["company", "job"];
const atsTypes = ["greenhouse", "lever"];

function usageReminder() {
  console.error(
    "Usage: npm fetch-input -- actionType atsType <companyId> [jobId]\n" +
      `  actionType: ${actionTypes.join("|")}\n` +
      `  atsType: ${atsTypes.join("|")}\n`
  );
  process.exit(1);
}

if (!actionTypes.includes(action) || !atsTypes.includes(atsId) || !companyId) {
  usageReminder();
}

async function getCompanyInput(): Promise<void> {
  const result = await ats.getCompany(
    { ats: atsId as ATS, id: companyId },
    true
  );

  await writeInputObj("fillCompany", `${atsId}_${companyId}`, result);
}

switch (action) {
  case "company":
    getCompanyInput();
    break;
  default:
    console.error("Unknown action");
}
