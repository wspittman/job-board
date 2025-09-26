import { llmModels } from "./src/evalConfig.ts";

const dataModels = ["company", "job"];

const args = process.argv.slice(2);
const [dataModel, llmModel] = args;

function usageReminder() {
  console.error(
    "Usage: npm run eval -- dataModel llmModel\n" +
      `  dataModel: ${dataModels.join("|")}\n` +
      `  llmModel: ${Object.keys(llmModels).join("|")}\n`
  );
}

async function runCompanyEval(): Promise<void> {
  // TBD
}

async function runJobEval(): Promise<void> {
  // TBD
}

async function run() {
  if (
    !dataModels.includes(dataModel) ||
    !Object.keys(llmModels).includes(llmModel)
  ) {
    usageReminder();
    return;
  }

  switch (dataModel) {
    case "company":
      runCompanyEval();
      break;
    case "job":
      runJobEval();
      break;
    default:
      console.error("Unknown dataModel");
  }
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
