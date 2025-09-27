import { dataModelBundles } from "./evalConfig";
import { catcher } from "./telemetryCatcher";
import type {
  Bag,
  DataModelBundle,
  MatchFunction,
  MatchResult,
  NumBag,
  Outcome,
  Rubric,
  Run,
  Source,
} from "./types";

/**
 * Evaluates a given scenario by running it and comparing the output against ground truth
 */
export async function evaluate(run: Run, source: Source): Promise<Outcome> {
  const prefix = `${run.runName} / ${source.sourceName}`;

  console.log(`${prefix}: Running inference`);
  const bundle = dataModelBundles[run.dataModel];
  const [metrics, output] = await runInference(bundle, source);

  if (!metrics) {
    throw new Error(`${prefix}: No metrics found`);
  }

  console.log(`${prefix}: Comparing ground truth`);
  const matches = await compare("", output, source.ground, bundle.rubric);

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
  bundle: DataModelBundle,
  source: Source
): Promise<[NumBag | undefined, Bag]> {
  // Use telemetryCatcher to mark the input and trace the LLM logs
  const [mark, markedInput] = catcher.createMarkedInput(source);
  await bundle.fn(markedInput);
  const metrics = catcher.find(mark);

  return [metrics, markedInput.item];
}

async function compare(
  property: string,
  actual: unknown,
  expected: unknown,
  matcher: MatchFunction | Rubric<Bag>
): Promise<MatchResult[]> {
  if (typeof matcher === "object" && matcher !== null) {
    const act = actual as Bag;
    const exp = expected as Bag;

    return (
      await Promise.all(
        Object.entries(matcher).map(async ([key, mVal]) => {
          return await compare(`${property}.${key}`, act[key], exp[key], mVal);
        })
      )
    ).flat();
  } else {
    return [
      await matcher({
        property,
        matcher: matcher.name,
        actual,
        expected,
      }),
    ];
  }
}
