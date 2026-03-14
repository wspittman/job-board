import { batch, subscribeAsyncLogging } from "dry-utils-async";
import { readSources, writeOutcome, writeReport } from "../eval/evalFiles.ts";
import type { Outcome, Run } from "../eval/evalTypes.ts";
import { evaluate, report } from "../eval/evaluate.ts";
import { llmModelCost } from "../eval/judge/rubrics.ts";
import { getLLMOptions, validateLLMAction } from "../portal/pFuncs.ts";
import type { Command } from "../types.ts";
import { embedCache } from "../utils/embedCache.ts";

subscribeAsyncLogging({
  log: ({ tag, val }) => console.log(tag, val),
  error: ({ tag, val }) => console.error(new Error(tag, { cause: val })),
});

export const evals: Command = {
  usage: () => "<LLM_ACTION> [RUN_NAME]",
  run,
};

async function run([
  llmActionArg,
  runName = `run_${Date.now()}`,
]: string[]): Promise<void> {
  const llmAction = validateLLMAction(llmActionArg);
  const { model, reasoningEffort } = getLLMOptions(llmAction);

  if (!llmModelCost[model]) {
    throw new Error(`${model} is not a known priced model`);
  }

  await runEval({ runName, llmAction, model, reasoningEffort });
  await embedCache.saveCache();
}

async function runEval(run: Run): Promise<void> {
  const { runName, llmAction, model, reasoningEffort = "" } = run;
  console.log(
    `${runName}: Run eval for ${llmAction} with ${model} ${reasoningEffort}`,
  );

  const sources = await readSources(llmAction);
  console.log(`${runName}: Found ${sources.length} sources`);

  const outcomes: Outcome[] = [];
  await batch(`${runName}_${llmAction}_${model}`, sources, async (source) => {
    // Read a previously saved outcome, or if not available run the evaluation.
    //let outcome = await readObj<Outcome<T>>(action, "Outcome", file);

    const outcome = await evaluate(run, source);
    outcomes.push(outcome);
    await writeOutcome(run, source, outcome);
  });

  const rep = report(run, outcomes);
  await writeReport(run, rep);
}
