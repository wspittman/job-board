import { Bag } from "../types/types";
import { CheckIn, CheckOut } from "./checks";

type CheckFunction = (input: CheckIn) => Promise<CheckOut>;

export type Rubric<T> = {
  [key in keyof T]: CheckFunction | Rubric<Bag>;
};

interface Judgement {
  match: {
    score: number;
    good: number;
    bad: number;
  };
  omit: {
    good: number;
    badFind: number;
    badOmit: number;
    precision: number;
    recall: number;
    f1: number;
  };
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

function aggregate(results: CheckOut[]): Judgement {
  const jd: Judgement = {
    match: {
      score: 0,
      good: 0,
      bad: 0,
    },
    omit: {
      good: 0,
      badFind: 0,
      badOmit: 0,
      precision: 0,
      recall: 0,
      f1: 0,
    },
    suboptimal: [],
  };

  for (const result of results) {
    const { score, match, omit } = result;
    jd.match.score += score ?? 0;
    jd.match.good += match ? 1 : 0;
    jd.match.bad += match ? 0 : 1;
    jd.omit.good += omit === "good" ? 1 : 0;
    jd.omit.badFind += omit === "badFind" ? 1 : 0;
    jd.omit.badOmit += omit === "badOmit" ? 1 : 0;

    if (!match && omit !== "good") {
      jd.suboptimal.push(result);
    }
  }

  jd.match.score /= jd.match.good + jd.match.bad || 1;

  // TBD: These should be optional + when to include?
  jd.omit.precision = jd.omit.good / (jd.omit.good + jd.omit.badOmit || 1);
  jd.omit.recall = jd.omit.good / (jd.omit.good + jd.omit.badFind || 1);
  jd.omit.f1 =
    (2 * (jd.omit.precision * jd.omit.recall)) /
    (jd.omit.precision + jd.omit.recall || 1);

  return jd;
}
