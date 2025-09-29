import { Bag, MatchFunction, MatchResult, Rubric } from "../types/types";

export async function compare(
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
