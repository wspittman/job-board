import { ats } from "../packages/backend/src/ats/ats.ts";
import type { ATS } from "../packages/backend/src/models/models.ts";
import { writeObj } from "./src/fileUtils.ts";

const actionTypes = ["company", "job"];
const atsTypes = ["greenhouse", "lever"];

const args = process.argv.slice(2);
const [action, atsId, companyId, jobId] = args;

function usageReminder() {
  console.error(
    "Usage: npm run eval-fetch-input -- actionType atsType <companyId> [jobId]\n" +
      `  actionType: ${actionTypes.join("|")}\n` +
      `  atsType: ${atsTypes.join("|")}\n`
  );
  process.exit(1);
}

if (!actionTypes.includes(action) || !atsTypes.includes(atsId) || !companyId) {
  usageReminder();
}

async function fetchCompanyInput(): Promise<void> {
  const result = await ats.getCompany(
    { id: companyId, ats: atsId as ATS },
    true
  );

  await writeObj(result, "Company", "Input", atsId, companyId);
}

async function fetchJobInput(): Promise<void> {
  if (!jobId) {
    console.error("Job ID is required for fetching job input.");
    usageReminder();
  }
  const result = await ats.getJob(
    { id: companyId, ats: atsId as ATS },
    { id: jobId, companyId }
  );
  await writeObj(result, "Job", "Input", atsId, companyId, jobId);
}

switch (action) {
  case "company":
    fetchCompanyInput();
    break;
  case "job":
    fetchJobInput();
    break;
  default:
    console.error("Unknown action");
}
