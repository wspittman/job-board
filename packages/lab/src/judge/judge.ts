import type { Bag } from "../types/types.ts";
import { type CheckOut, type Rubric, runChecks } from "./checks.ts";
import { checksToStats, combineStats, type Stats } from "./stats.ts";

export interface Judgement extends Stats {
  suboptimal?: CheckOut[];
}

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
