import { Bag } from "../types/types";
import { CheckOut, Rubric, runChecks } from "./checks";
import { checksToStats, combineStats, Stats } from "./stats";

export interface Judgement extends Stats {
  suboptimal?: CheckOut[];
}

export async function judge(
  actual: Bag,
  expected: Bag,
  rubric: Rubric<Bag>
): Promise<Judgement> {
  const results = await runChecks(actual, expected, rubric);
  const stats = checksToStats(results);

  return {
    ...stats,
    suboptimal: results.filter(
      (r) => (r.score ?? 0) < 0.8 && r.omit !== "good"
    ),
  };
}

export function aggregate(judgments: Judgement[]): Judgement {
  return combineStats(judgments);
}
