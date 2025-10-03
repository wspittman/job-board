import { llmModelCost, rubrics } from "./evalConfig";
import { aggregate, judge, Judgement } from "./judge/judge";
import { infer } from "./portal/pFuncs";
import type { Bag, NumBag, Run, Source } from "./types/types";
import { addNumBags, cost, truncate } from "./utils/mathUtils";
import { catcher } from "./utils/telemetryCatcher";

export interface Outcome extends Run, Judgement {
  sourceName: string;
  metrics: NumBag;
  cost: number;
  avgCost?: number;
  output: Bag;
  costPerMillion?: number;
}

/**
 * Evaluates a given scenario by running it and comparing the output against ground truth
 */
export async function evaluate(run: Run, source: Source): Promise<Outcome> {
  const prefix = `${run.runName} / ${source.sourceName}`;

  console.log(`${prefix}: Running inference`);
  const [metrics, output] = await runInference(run, source);

  if (!metrics) {
    throw new Error(`${prefix}: No metrics found`);
  }

  console.log(`${prefix}: Comparing ground truth`);
  const judgement = await judge(output, source.ground, rubrics[run.dataModel]);

  console.log(`${prefix}: Building outcome`);
  const [inCost, outCost] = llmModelCost[run.llmModel] || [0, 0];

  return {
    ...run,
    sourceName: source.sourceName,
    metrics,
    cost: cost(metrics.inTokens, metrics.outTokens, inCost, outCost),
    ...judgement,
    output,
  };
}

export async function report(run: Run, outcomes: Outcome[]) {
  console.log(`Combining ${outcomes.length} outcomes`);

  const cost = outcomes.reduce((a, o) => a + o.cost, 0);
  const avgCost = cost / (outcomes.length || 1);
  const costPerMillion = avgCost * 1_000_000;

  return {
    ...run,
    metrics: outcomes.reduce((a, o) => addNumBags(a, o.metrics), {} as NumBag),
    cost: truncate(cost, 8),
    avgCost: truncate(avgCost, 8),
    ...aggregate(outcomes),
    costPerMillion: truncate(costPerMillion, 2),
  };
}

async function runInference(
  run: Run,
  source: Source
): Promise<[NumBag | undefined, Bag]> {
  // Use telemetryCatcher to mark the input and trace the LLM logs
  const [mark, markedInput] = catcher.createMarkedInput(source);
  await infer(run.dataModel, markedInput);
  const metrics = catcher.find(mark);

  return [metrics, markedInput.item as Bag];
}
