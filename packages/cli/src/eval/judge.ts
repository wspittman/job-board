import type { Bag } from "../types.ts";
import type { Judgement, Rubric } from "./evalTypes.ts";
import { runChecks } from "./judge/checks.ts";
import { checksToStats, combineStats } from "./judge/stats.ts";

export async function judge(
  actual: Bag,
  expected: Bag,
  rubric: Rubric<Bag>,
): Promise<Judgement> {
  const results = await runChecks(actual, expected, rubric);
  const stats = checksToStats(results);

  return {
    ...stats,
    suboptimal: results.filter(
      (r) => (r.score ?? 0) < 0.8 && r.omit !== "good",
    ),
  };
}

export function aggregate(judgments: Judgement[]): Judgement {
  return combineStats(judgments);
}
