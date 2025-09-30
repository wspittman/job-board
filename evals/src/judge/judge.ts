import { Bag } from "../types/types";
import { Rubric, runChecks } from "./checks";
import { checksToStats } from "./stats";

export async function judge(actual: Bag, expected: Bag, rubric: Rubric<Bag>) {
  const results = await runChecks(actual, expected, rubric);
  const stats = checksToStats(results);

  return {
    ...stats,
    suboptimal: results.filter(
      (r) => (r.score ?? 0) < 0.8 && r.omit !== "good"
    ),
  };
}
