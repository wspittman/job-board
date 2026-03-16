import timers from "node:timers/promises";
import { fetchJobCount, validateAts } from "../portal/pFuncs.ts";
import type { Bag } from "../types.ts";
import { type Command } from "../types.ts";
import { writeObj } from "../utils/fileUtils.ts";
import { validateIds } from "../utils/utils.ts";

export const jobCounts: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run,
};

async function run([atsArg, ...companyArgs]: string[]): Promise<void> {
  const ats = validateAts(atsArg);
  const companyIds = validateIds("COMPANY_IDs", companyArgs);
  const counts: Bag = {};

  console.log(`Get job counts for ${companyIds.length} ${ats} companies...`);

  for (const companyId of companyIds) {
    try {
      counts[companyId] = await fetchJobCount(ats, companyId);
    } catch (error) {
      counts[companyId] =
        error instanceof Error ? error.message : String(error);
    }
    process.stdout.write(".");
    await timers.setTimeout(100); // Throttle requests
  }

  await writeObj(
    { ats, counts },
    {
      group: "jobCounts",
      stage: "out",
      file: `${ats}_${Date.now()}`,
    },
  );

  if (companyIds.length < 25) {
    console.log("\nJob Counts:", counts);
  }
}
