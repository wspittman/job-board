import { batch, subscribeAsyncLogging } from "dry-utils-async";
import { llmModelCost } from "../evalConfig.ts";
import { evaluate, report, type Outcome } from "../evaluate.ts";
import {
  LLM_MODEL,
  LLM_REASONING_EFFORT,
  validateDataModel,
  validateLLMAction,
} from "../portal/pFuncs.ts";
import type { Command, Run, Source } from "../types/types.ts";
import { embedCache } from "../utils/embedCache.ts";
import { readManyObj, writeObj, type Place } from "../utils/fileUtils.ts";

subscribeAsyncLogging({
  log: ({ tag, val }) => console.log(tag, val),
  error: ({ tag, val }) => console.error(new Error(tag, { cause: val })),
});

export const evals: Command = {
  usage: () => "<DATA_MODEL> <LLM_ACTION> [RUN_NAME]",
  run,
};

async function run([
  dataModelArg,
  llmActionArg,
  runName = `run_${Date.now()}`,
]: string[]): Promise<void> {
  const dataModel = validateDataModel(dataModelArg);
  const llmAction = validateLLMAction(dataModel, llmActionArg);
  const llmModel = LLM_MODEL;
  const llmReasoningEffort = LLM_REASONING_EFFORT;

  if (!Object.keys(llmModelCost).includes(llmModel)) {
    throw new Error(`Config.LLM_MODEL ${llmModel} is not a known priced model`);
  }

  await runEval({
    runName,
    dataModel,
    llmAction,
    llmModel,
    llmReasoningEffort,
  });
  await embedCache.saveCache();
}

async function runEval(run: Run): Promise<void> {
  const { runName, dataModel, llmAction, llmModel, llmReasoningEffort } = run;
  console.log(
    `${runName}: Running eval for ${dataModel} with ${llmAction} ${llmModel} ${llmReasoningEffort ?? ""}`.trim(),
  );

  const sources = await readManyObj<Source>({
    group: "eval",
    stage: "in",
    folder: dataModel,
  });
  console.log(`${runName}: Found ${sources.length} sources`);

  const outcomes: Outcome[] = [];
  const outFolder: Place = {
    group: "eval",
    stage: "out",
    folder: [dataModel, runName, llmAction, llmModel, llmReasoningEffort ?? ""],
  };

  await batch(
    `${runName}_${dataModel}_${llmAction}_${llmModel}`,
    sources,
    async (source) => {
      // Read a previously saved outcome, or if not available run the evaluation.
      //let outcome = await readObj<Outcome<T>>(action, "Outcome", file);

      const outcome = await evaluate(run, source);
      outcomes.push(outcome);

      await writeObj(outcome, {
        ...outFolder,
        file: source.fileName,
      });
    },
  );

  const rep = report(run, outcomes);
  await writeObj(rep, {
    ...outFolder,
    file: "Report",
  });
}
