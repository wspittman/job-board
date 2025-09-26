import { llmModels } from "./src/evalConfig.ts";
import { readSources } from "./src/fileUtils.ts";
import { Company, Job, LLM_MODEL } from "./src/packagePortal.ts";
import { Run, Scenario } from "./src/types.ts";

const dataModels = ["company", "job"];

function usageReminder() {
  console.error(
    "Usage: npm run eval -- dataModel [runName]\n" +
      `  dataModel: ${dataModels.join("|")}\n` +
      "  runName: optional name for this run"
  );
}

async function runEval<T>(run: Run): Promise<void> {
  const { runName, dataModel } = run;
  console.log(`${runName}: Running eval for ${dataModel}`);

  const sources = await readSources<T>(dataModel);
  console.log(`${runName}: Found ${sources.length} sources`);

  const scenarios: Scenario<T>[] = sources.map((source) => ({
    ...run,
    source,
  }));

  // for the moment, just draw out the first scenario
  const scenario = scenarios[0];

  // Read a previously saved outcome, or if not available run the evaluation.
  //let outcome = await readObj<Outcome<T>>(action, "Outcome", file);
  //outcome ??= await evaluate(scenario);
  /*const outcome = await evaluate(scenario);
  await writeObj(
    outcome,
    dataModel,
    "Outcome",
    runName,
    llmModel,
    scenario.source.sourceName
  );*/
}

async function run() {
  const args = process.argv.slice(2);
  const [dataModel, runName = `run_${Date.now()}`] = args;
  const llmModel = LLM_MODEL;

  if (!dataModels.includes(dataModel)) {
    usageReminder();
    return;
  }

  if (!Object.keys(llmModels).includes(llmModel)) {
    console.error(`Config.LLM_MODEL ${llmModel} is not a known priced model`);
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
