import { compare } from "./compare/compare";
import { rubrics } from "./evalConfig";
import { infer } from "./portal/pFuncs";
import type { Bag, NumBag, Outcome, Run, Source } from "./types/types";
import { catcher } from "./utils/telemetryCatcher";

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
  const matches = await compare(
    "",
    output,
    source.ground,
    rubrics[run.dataModel]
  );

  console.log(`${prefix}: Building outcome`);

  return {
    ...run,
    timestamp: new Date().toISOString(),
    metrics,
    cost: 0, // TBD
    score: 0, // TBD
    matches: matches.reduce((sum, m) => sum + (m.match ? 1 : 0), 0),
    badMatches: matches.reduce((sum, m) => sum + (m.badMatch ? 1 : 0), 0),
    badFinds: matches.reduce((sum, m) => sum + (m.badFind ? 1 : 0), 0),
    badOmits: matches.reduce((sum, m) => sum + (m.badOmit ? 1 : 0), 0),
    sourceName: source.sourceName,
    output,
    suboptimal: [], // TBD
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
