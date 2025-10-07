import process from "node:process";
import { fetcher } from "./fetcher.ts";

const atsTypes = ["greenhouse", "lever"];

function usageReminder() {
  console.error(
    "Usage: npm run add-companies -- <ATS_ID> <COMPANY_ID> [...COMPANY_ID]\n" +
      `  atsType: ${atsTypes.join("|")}\n`
  );
}

async function addCompanies(ats: string, ids: string[]): Promise<void> {
  console.log(`Adding ${ids.length} companies from ${ats}`);
  const result = await fetcher("/companies", "PUT", { ats, ids });
  console.log("Success", result);
}

async function run() {
  const args = process.argv.slice(2);
  let [ats, ...companyIds] = args;
  ats = ats?.toLowerCase() ?? "";
  companyIds = companyIds.map((id) => id.trim()).filter((id) => !!id.length);

  if (!atsTypes.includes(ats) || !companyIds.length) {
    usageReminder();
    return;
  }

  await addCompanies(ats, companyIds);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
