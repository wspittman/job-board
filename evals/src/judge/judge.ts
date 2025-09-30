import { Bag } from "../types/types";
import { CheckIn, CheckOut } from "./checks";

type CheckFunction = (input: CheckIn) => Promise<CheckOut>;

export type Rubric<T> = {
  [key in keyof T]: CheckFunction | Rubric<Bag>;
};

interface Judgement {
  score: number;
  matches: number;
  badMatches: number;
  badFinds: number;
  badOmits: number;
  suboptimal: CheckOut[];
}

export async function judge(
  actual: Bag,
  expected: Bag,
  rubric: Rubric<Bag>
): Promise<Judgement> {
  const results = await runChecks("", actual, expected, rubric);
  return aggregate(results);
}

async function runChecks(
  prop: string,
  actual: unknown,
  expected: unknown,
  check: CheckFunction | Rubric<Bag>
): Promise<CheckOut[]> {
  if (typeof check === "object" && check !== null) {
    const act = actual as Bag;
    const exp = expected as Bag;

    return (
      await Promise.all(
        Object.entries(check).map(async ([key, mVal]) => {
          const newProp = prop ? `${prop}.${key}` : key;
          return await runChecks(newProp, act[key], exp[key], mVal);
        })
      )
    ).flat();
  }

  return [await check({ prop, actual, expected })];
}

export function aggregate(results: CheckOut[]): Judgement {
  const jd: Judgement = {
    score: 0,
    matches: 0,
    badMatches: 0,
    badFinds: 0,
    badOmits: 0,
    suboptimal: [],
  };

  for (const result of results) {
    const { score, out } = result;
    jd.score += score;
    jd.matches += out === "match" ? 1 : 0;
    jd.badMatches += out === "badMatch" ? 1 : 0;
    jd.badFinds += out === "badFind" ? 1 : 0;
    jd.badOmits += out === "badOmit" ? 1 : 0;

    if (out !== "match") {
      jd.suboptimal.push(result);
    }
  }

  jd.score /= results.length;

  return jd;
}
