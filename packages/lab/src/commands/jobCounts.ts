import { setTimeout } from "node:timers/promises";
import { fetchJobCount, validateAts } from "../portal/pFuncs.ts";
import { CommandError, type Command } from "../types.ts";
import type { Bag } from "../types/types.ts";
import { writeObj } from "../utils/fileUtils.ts";

export const jobCounts: Command = {
  usage: () => "<ATS> <COMPANY_ID[, ...]>",
  run,
};

function validateIds(name: string, ids: string[]): string[] {
  const validIds = ids
    .map((id) => id?.replace(",", "").trim() || "")
    .filter((id) => !!id);

  if (!validIds.length) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return validIds;
}

async function run([atsArg, ...companyArgs]: string[]): Promise<void> {
  const ats = validateAts(atsArg);
  const companyIds = validateIds("COMPANY_IDs", companyArgs);

  if (!companyIds.length) {
    throw new CommandError("Invalid argument: COMPANY_IDs");
  }

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
    await setTimeout(100); // Throttle requests
  }

  await writeObj({ ats, counts }, "Outcome", "job_counts", `${Date.now()}`);

  if (companyIds.length < 5) {
    console.log("\nJob Counts:", counts);
  }
}
