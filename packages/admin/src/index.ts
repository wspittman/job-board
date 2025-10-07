import process from "node:process";
import { fetcher } from "./fetcher.ts";

const atsTypes = ["greenhouse", "lever"];

function usageReminder() {
  console.error(
    [
      "Usage:",
      "  npm run add-companies -- <ATS_ID> <COMPANY_ID> [...COMPANY_ID]",
      `    atsType: ${atsTypes.join("|")}`,
      "",
      "  npm run delete-job -- <JOB_ID> <COMPANY_ID>",
    ].join("\n")
  );
}

async function addCompanies(ats: string, ids: string[]): Promise<void> {
  console.log(`Adding ${ids.length} companies from ${ats}`);
  const result = await fetcher("companies", "PUT", { ats, ids });
  console.log("Success", result);
}

async function deleteJob(jobId: string, companyId: string): Promise<void> {
  console.log(`Deleting job ${jobId} for company ${companyId}`);
  const result = await fetcher("job", "DELETE", {
    id: jobId,
    companyId,
  });
  console.log("Success", result);
}

async function handleAddCompanies(args: string[]): Promise<void> {
  let [ats, ...companyIds] = args;
  ats = ats?.toLowerCase() ?? "";
  companyIds = companyIds
    .map((id) => id.replace(",", "").trim())
    .filter((id) => !!id.length);

  if (!atsTypes.includes(ats) || !companyIds.length) {
    usageReminder();
    return;
  }

  await addCompanies(ats, companyIds);
}

async function handleDeleteJob(args: string[]): Promise<void> {
  const [jobId, companyId] = args.map((value) => value?.trim() ?? "");

  if (!jobId || !companyId) {
    usageReminder();
    return;
  }

  await deleteJob(jobId, companyId);
}

async function run() {
  const args = process.argv.slice(2);

  if (args[0]?.toLowerCase() === "delete-job") {
    await handleDeleteJob(args.slice(1));
    return;
  }

  await handleAddCompanies(args);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
