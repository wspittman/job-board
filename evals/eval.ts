import { llmModelCost } from "./src/evalConfig.ts";
import { evaluate } from "./src/evaluate.ts";
import {
  dataModelTypes,
  isValidDataModel,
  LLM_MODEL,
} from "./src/portal/pFuncs.ts";
import { Run } from "./src/types/types.ts";
import { readSources, writeObj } from "./src/utils/fileUtils.ts";

function usageReminder() {
  console.error(
    "Usage: npm run eval -- dataModel [runName]\n" +
      `  dataModel: ${dataModelTypes.join("|")}\n` +
      "  runName: optional name for this run"
  );
}

async function runEval(run: Run): Promise<void> {
  const { runName, dataModel, llmModel } = run;
  console.log(`${runName}: Running eval for ${dataModel} with ${llmModel}`);

  const sources = await readSources(dataModel);
  console.log(`${runName}: Found ${sources.length} sources`);

  // For now, just evaluate the first source as a proof of concept.
  const outcome = await evaluate(run, sources[0]);

  await writeObj(
    outcome,
    "Outcome",
    dataModel,
    runName,
    llmModel,
    sources[0].sourceName
  );

  // Read a previously saved outcome, or if not available run the evaluation.
  //let outcome = await readObj<Outcome<T>>(action, "Outcome", file);
  //outcome ??= await evaluate(scenario);
  /*const outcome = await evaluate(scenario);
  await writeObj(
    outcome,
    "Outcome",
    dataModel,
    runName,
    llmModel,
    scenario.source.sourceName
  );*/
}

async function run() {
  const args = process.argv.slice(2);
  const [dataModelArg, runName = `run_${Date.now()}`] = args;
  const dataModel = dataModelArg?.toLowerCase();
  const llmModel = LLM_MODEL;

  if (!isValidDataModel(dataModel)) {
    usageReminder();
    return;
  }

  if (!Object.keys(llmModelCost).includes(llmModel)) {
    console.error(`Config.LLM_MODEL ${llmModel} is not a known priced model`);
    return;
  }

  await runEval({ runName, dataModel, llmModel });
}

run().catch((err) => {
  console.error("Error running evaluation:", err);
});
