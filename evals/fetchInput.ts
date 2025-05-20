import { writeFile } from "fs/promises";
import { ats } from "../packages/backend/src/ats/ats.ts";
import type { ATS } from "../packages/backend/src/types/dbModels.ts";

const args = process.argv.slice(2);
const [action, atsId, companyId, jobId] = args;

function usageReminder() {
  console.error(
    "Usage: node fetchInput.js 'company'|'job' 'greenhouse'|'lever' <companyId> [jobId]"
  );
  process.exit(1);
}

if (
  !["company", "job"].includes(action) ||
  !["greenhouse", "lever"].includes(atsId) ||
  !companyId
) {
  usageReminder();
}

if (action === "company") {
  async function getCompanyInput(): Promise<void> {
    const result = await ats.getCompany(
      { ats: atsId as ATS, id: companyId },
      true
    );

    await writeFile(
      `./evals/companyInputs/${atsId}_${companyId}.json`,
      JSON.stringify(result, null, 2)
    );
  }

  getCompanyInput();
}
