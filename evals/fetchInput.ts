import { atsTypes, dataModels } from "./src/evalConfig.ts";
import { writeObj } from "./src/fileUtils.ts";
import { type ATS, ats } from "./src/packagePortal.ts";

function usageReminder() {
  console.error(
    "Usage: npm run eval-fetch-input -- dataModel atsType <companyId> [jobId]\n" +
      `  dataModel: ${dataModels.join("|")}\n` +
      `  atsType: ${atsTypes.join("|")}\n`
  );
}

async function fetchCompanyInput(
  companyId: string,
  atsId: string
): Promise<void> {
  const result = await ats.getCompany(
    { id: companyId, ats: atsId as ATS },
    true
  );

  await writeObj(result, "Input", "company", atsId, companyId);
}

async function fetchJobInput(
  companyId: string,
  atsId: string,
  jobId: string
): Promise<void> {
  if (!jobId) {
    console.error("Job ID is required for fetching job input.");
    usageReminder();
  }
  const result = await ats.getJob(
    { id: companyId, ats: atsId as ATS },
    { id: jobId, companyId }
  );
  await writeObj(result, "Input", "job", atsId, companyId, jobId);
}

async function run() {
  const args = process.argv.slice(2);
  const [dataModel, atsId, companyId, jobId] = args;
  const dm = dataModel?.toLowerCase();
  const ats = atsId?.toLowerCase();

  if (!dataModels.includes(dm) || !atsTypes.includes(ats) || !companyId) {
    usageReminder();
    return;
  }

  switch (dm) {
    case "company":
      await fetchCompanyInput(companyId, ats);
      break;
    case "job":
      await fetchJobInput(companyId, ats, jobId);
      break;
    default:
      console.error("Unknown dataModel");
  }
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
