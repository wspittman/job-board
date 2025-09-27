import { writeObj } from "./src/fileUtils.ts";
import { type ATS, ats } from "./src/packagePortal.ts";

const dataModels = ["company", "job"];
const atsTypes = ["greenhouse", "lever"];

const args = process.argv.slice(2);
const [dataModel, atsId, companyId, jobId] = args;

function usageReminder() {
  console.error(
    "Usage: npm run eval-fetch-input -- dataModel atsType <companyId> [jobId]\n" +
      `  dataModel: ${dataModels.join("|")}\n` +
      `  atsType: ${atsTypes.join("|")}\n`
  );
}

async function fetchCompanyInput(): Promise<void> {
  const result = await ats.getCompany(
    { id: companyId, ats: atsId as ATS },
    true
  );

  await writeObj(result, "Input", "Company", atsId, companyId);
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
  await writeObj(result, "Input", "Job", atsId, companyId, jobId);
}

async function run() {
  if (
    !dataModels.includes(dataModel) ||
    !atsTypes.includes(atsId) ||
    !companyId
  ) {
    usageReminder();
    return;
  }

  switch (dataModel) {
    case "company":
      await fetchCompanyInput();
      break;
    case "job":
      await fetchJobInput();
      break;
    default:
      console.error("Unknown dataModel");
  }
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
