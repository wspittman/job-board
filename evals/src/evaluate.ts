import { rubrics } from "./evalConfig";
import { judge } from "./judge/judge";
import { infer } from "./portal/pFuncs";
import type { Bag, NumBag, Run, Source } from "./types/types";
import { catcher } from "./utils/telemetryCatcher";

/**
 * Evaluates a given scenario by running it and comparing the output against ground truth
 */
export async function evaluate(run: Run, source: Source) {
  const prefix = `${run.runName} / ${source.sourceName}`;

  console.log(`${prefix}: Running inference`);
  const [metrics, output] = await runInference(run, source);

  if (!metrics) {
    throw new Error(`${prefix}: No metrics found`);
  }

  console.log(`${prefix}: Comparing ground truth`);
  const judgement = await judge(output, source.ground, rubrics[run.dataModel]);

  console.log(`${prefix}: Building outcome`);

  return {
    ...run,
    sourceName: source.sourceName,
    metrics,
    cost: 0, // TBD
    output,
    ...judgement,
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
