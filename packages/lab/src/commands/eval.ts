import { batch, subscribeAsyncLogging } from "dry-utils-async";
import { llmModelCost } from "../evalConfig.ts";
import { evaluate, report, type Outcome } from "../evaluate.ts";
import {
  LLM_MODEL,
  LLM_REASONING_EFFORT,
  validateDataModel,
} from "../portal/pFuncs.ts";
import type { Command } from "../types.ts";
import type { Run } from "../types/types.ts";
import { embedCache } from "../utils/embedCache.ts";
import { readSources, writeObj } from "../utils/fileUtils.ts";

subscribeAsyncLogging({
  log: ({ tag, val }) => console.log(tag, val),
  error: ({ tag, val }) => console.error(new Error(tag, { cause: val })),
});

export const evals: Command = {
  usage: () => "<DATA_MODEL> [RUN_NAME]",
  run,
};

async function run([
  dataModelArg,
  runName = `run_${Date.now()}`,
]: string[]): Promise<void> {
  const dataModel = validateDataModel(dataModelArg);
  const llmModel = LLM_MODEL;
  const llmReasoningEffort = LLM_REASONING_EFFORT;

  if (!Object.keys(llmModelCost).includes(llmModel)) {
    throw new Error(`Config.LLM_MODEL ${llmModel} is not a known priced model`);
  }

  await runEval({ runName, dataModel, llmModel, llmReasoningEffort });
  await embedCache.saveCache();
}

async function runEval(run: Run): Promise<void> {
  const { runName, dataModel, llmModel, llmReasoningEffort } = run;
  console.log(
    `${runName}: Running eval for ${dataModel} with ${llmModel} ${llmReasoningEffort ?? ""}`.trim(),
  );

  const sources = await readSources(dataModel);
  console.log(`${runName}: Found ${sources.length} sources`);

  const outcomes: Outcome[] = [];

  await batch(
    `${runName}_${dataModel}_${llmModel}`,
    sources,
    async (source) => {
      // Read a previously saved outcome, or if not available run the evaluation.
      //let outcome = await readObj<Outcome<T>>(action, "Outcome", file);

      const outcome = await evaluate(run, source);
      outcomes.push(outcome);

      await writeObj(
        outcome,
        "Outcome",
        dataModel,
        runName,
        llmModel,
        llmReasoningEffort ?? "",
        source.sourceName,
      );
    },
  );

  const rep = report(run, outcomes);
  await writeObj(
    rep,
    "Report",
    dataModel,
    runName,
    llmModel,
    llmReasoningEffort ?? "",
  );
}
