import { llmModels } from "./src/evalConfig.ts";
import { readSources } from "./src/fileUtils.ts";
import { Company, Job } from "./src/packagePortal.ts";
import { Run, Scenario } from "./src/types.ts";

const dataModels = ["company", "job"];

function usageReminder() {
  console.error(
    "Usage: npm run eval -- dataModel llmModel runName\n" +
      `  dataModel: ${dataModels.join("|")}\n` +
      `  llmModel: ${Object.keys(llmModels).join("|")}\n` +
      "  runName: optional name for this run"
  );
}

async function runEval<T>(run: Run): Promise<void> {
  const { runName, dataModel, llmModel } = run;
  console.log(`${runName}: Running eval for ${dataModel} with LLM ${llmModel}`);

  const sources = await readSources<T>(dataModel);
  console.log(`${runName}: Found ${sources.length} sources`);

  const scenarios: Scenario<T>[] = sources.map((source) => ({
    ...run,
    source,
  }));
}

async function run() {
  const args = process.argv.slice(2);
  const [dataModel, llmModel, runName = `run_${Date.now()}`] = args;

  if (
    !dataModels.includes(dataModel) ||
    !Object.keys(llmModels).includes(llmModel)
  ) {
    usageReminder();
    return;
  }

  switch (dataModel) {
    case "company":
      await runEval<Company>({ runName, dataModel: "Company", llmModel });
      break;
    case "job":
      await runEval<Job>({ runName, dataModel: "Job", llmModel });
      break;
    default:
      console.error("Unknown dataModel");
  }
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
