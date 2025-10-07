import process from "node:process";
import { addCompanies, deleteJob } from "./commands.ts";
import { atsTypes, commands } from "./types.ts";

function usageReminder() {
  console.error(
    [
      "Usage:",
      "  npm run admin -- <COMMAND> <ARGS>",
      "",
      `  COMMAND: ${commands.join("|")}`,
      "",
      "  npm run admin -- add-companies <ATS_ID> <COMPANY_ID> [...COMPANY_ID]",
      `    ATS_ID: ${atsTypes.join("|")}`,
      "",
      "  npm run admin -- delete-job <COMPANY_ID> <JOB_ID>",
    ].join("\n")
  );
}

async function run() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "add-companies":
      await addCompanies(args);
      break;
    case "delete-job":
      await deleteJob(args);
      break;
    default:
      throw new Error("Invalid command");
  }
}

run().catch((err) => {
  if (
    err instanceof Error &&
    ["Invalid command", "Invalid arguments"].includes(err.message)
  ) {
    usageReminder();
  }
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
