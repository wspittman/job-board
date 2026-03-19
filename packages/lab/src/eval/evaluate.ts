import { infer } from "../portal/pFuncs.ts";
import type { Bag, NumBag } from "../types.ts";
import { addNumBags } from "../utils/mathUtils.ts";
import { catcher } from "../utils/telemetryCatcher.ts";
import { cost, costAg } from "./cost.ts";
import type { Outcome, Report, Run, Source } from "./evalTypes.ts";
import { aggregate, judge } from "./judge.ts";
import { rubrics } from "./judge/rubrics.ts";

/**
 * Evaluates a given scenario by running it and comparing the output against ground truth
 */
export async function evaluate(run: Run, source: Source): Promise<Outcome> {
  const prefix = `${run.runName} / ${source.name}`;

  console.log(`${prefix}: Running inference`);
  const [metrics, output] = await runInference(run, source);

  if (!metrics) {
    throw new Error(`${prefix}: No metrics found`);
  }

  console.log(`${prefix}: Comparing ground truth`);
  const judgement = await judge(output, source.truth, rubrics[run.llmAction]);

  console.log(`${prefix}: Building outcome`);

  return {
    ...run,
    sourceName: source.name,
    metrics,
    cost: cost(run.model, run.llmAction, metrics),
    ...judgement,
    output,
  };
}

export function report(run: Run, outcomes: Outcome[]): Report {
  console.log(`Combining ${outcomes.length} outcomes`);

  const { cost, avgCost, costPerYear, costPerMillion } = costAg(
    run.llmAction,
    outcomes.map((o) => o.cost),
  );

  return {
    ...run,
    metrics: outcomes.reduce((a, o) => addNumBags(a, o.metrics), {} as NumBag),
    cost,
    avgCost,
    costPerMillion,
    ...aggregate(outcomes),
    costPerYear,
  };
}

async function runInference(
  run: Run,
  source: Source,
): Promise<[NumBag | undefined, Bag]> {
  // Use telemetryCatcher to mark the input and trace the LLM logs
  const [mark, markedInput] = catcher.createMarkedInput(
    source.name,
    source.input,
  );
  const result = await infer(run.llmAction, markedInput);
  const metrics = catcher.find(mark);

  return [metrics, result];
}
