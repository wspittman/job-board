import { batch, subscribeAsyncLogging } from "dry-utils-async";
import { logger } from "dry-utils-logger";
import { getLLMOptions, validateLLMAction } from "../portal/pFuncs.ts";
import { llmActionTypes } from "../portal/pTypes.ts";
import { CommandError, type Command } from "../types.ts";
import { embedCache } from "../utils/embedCache.ts";
import { isCostAvailable } from "./cost.ts";
import { readSources, writeOutcome, writeReport } from "./evalFiles.ts";
import type { Outcome, Run } from "./evalTypes.ts";
import { evaluate, report } from "./evaluate.ts";

subscribeAsyncLogging({
  log: ({ tag, val }) => logger.info(tag, val),
  error: ({ tag, val }) => logger.error(tag, val),
});

export const evals: Command = {
  args: "<LLM_ACTION> [RUN_NAME]",
  usage: [
    "Run evaluation for the specified LLM action and save the outcomes and report",
    `LLM_ACTION: ${llmActionTypes.join("|")}`,
  ],
  run,
};

async function run([
  llmActionArg,
  runName = `run_${Date.now()}`,
]: string[]): Promise<void> {
  const llmAction = validateLLMAction(llmActionArg);
  const { model, reasoningEffort } = getLLMOptions(llmAction);

  if (!isCostAvailable(model, llmAction)) {
    throw new CommandError(
      `${model} / ${llmAction} does not have cost data available`,
    );
  }

  await runEval({ runName, llmAction, model, reasoningEffort });
  await embedCache.saveCache();
}

async function runEval(run: Run): Promise<void> {
  const { runName, llmAction, model, reasoningEffort = "" } = run;
  logger.info(
    `${runName}: Run eval for ${llmAction} with ${model} ${reasoningEffort}`,
  );

  const sources = await readSources(llmAction);
  logger.info(`${runName}: Found ${sources.length} sources`);

  const outcomes: Outcome[] = [];
  await batch(`${runName}_${llmAction}_${model}`, sources, async (source) => {
    const outcome = await evaluate(run, source);
    outcomes.push(outcome);
    await writeOutcome(run, source, outcome);
  });

  const rep = report(run, outcomes);
  await writeReport(run, rep);
}
