import type { Bag } from "../types/types.ts";
import { embedCache } from "../utils/embedCache.ts";
import { cosineSimilarity } from "../utils/mathUtils.ts";

interface CheckIn {
  prop: string;
  actual: unknown;
  expected: unknown;
}

export interface CheckOut extends CheckIn {
  check: string;
  // Either score or omit will be set
  omit?: "good" | "badFind" | "badOmit";
  score?: number;
}

type CheckFunction = (input: CheckIn) => CheckOut | Promise<CheckOut>;

export type Rubric<T> = {
  [key in keyof T]: CheckFunction | Rubric<Bag>;
};

export async function runChecks(
  actual: Bag,
  expected: Bag,
  rubric: Rubric<Bag>,
): Promise<CheckOut[]> {
  return await runChecksInternal("", actual, expected, rubric);
}

async function runChecksInternal(
  prop: string,
  actual: unknown,
  expected: unknown,
  check: CheckFunction | Rubric<Bag>,
): Promise<CheckOut[]> {
  if (typeof check === "object" && check !== null) {
    const act = actual as Bag;
    const exp = expected as Bag;

    return (
      await Promise.all(
        Object.entries(check).map(async ([key, mVal]) => {
          const newProp = prop ? `${prop}.${key}` : key;
          return await runChecksInternal(newProp, act?.[key], exp?.[key], mVal);
        }),
      )
    ).flat();
  }

  return [await check({ prop, actual, expected })];
}

// #region Check Functions

/**
 * Checks if the actual value is strictly equal to the ground truth value.
 */
export function equals(input: CheckIn): CheckOut {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;
  const match = actual === expected;

  return { check: equals.name, score: match ? 1 : 0, ...input };
}

export function equalsCasePreferred(input: CheckIn): CheckOut {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;

  if (actual === expected) {
    return { check: equalsCasePreferred.name, score: 1, ...input };
  }

  if (!isEqualCaseInsensitive(actual, expected)) {
    return { check: equalsCasePreferred.name, score: 0, ...input };
  }

  const actualStr = String(actual);
  const expectedStr = String(expected);

  let dist = 0;
  for (let i = 0; i < expectedStr.length; i++) {
    if (expectedStr[i] !== actualStr[i]) {
      dist++;
    }
  }

  const score = 1 - dist / expectedStr.length;

  return { check: equalsCasePreferred.name, score, ...input };
}

export function equalsUrl(input: CheckIn): CheckOut {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;
  const aUrl = new URL(String(actual));
  const eUrl = new URL(String(expected));

  let score = 0;
  if (aUrl.href === eUrl.href) {
    score = 1;
  } else if (
    aUrl.hostname === eUrl.hostname &&
    aUrl.pathname === eUrl.pathname
  ) {
    score = 0.5;
  } else if (
    aUrl.hostname.includes(eUrl.hostname) ||
    eUrl.hostname.includes(aUrl.hostname)
  ) {
    score = 0.25;
  }

  return { check: equals.name, score, ...input };
}

/**
 * Checks if the actual string value is semantically similar to the expected string value
 * using cosine similarity of their embeddings.
 * @param actual The actual value, converted to a string.
 * @param expected The expected value, converted to a string.
 * @returns A similarity score between 0 and 1.
 */
export async function similar(input: CheckIn): Promise<CheckOut> {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;
  const [actualEmb = [], expectedEmb = []] =
    (await embedCache.getEmbeddings("similar", [
      String(actual),
      String(expected),
    ])) ?? [];

  // If either embedding failed, return 0 similarity.
  const eitherFails = !actualEmb.length || !expectedEmb.length;
  const score = eitherFails ? 0 : cosineSimilarity(actualEmb, expectedEmb);

  return { check: similar.name, score, ...input };
}

export function arrayExactMatcher(input: CheckIn): CheckOut {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;

  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return { check: arrayExactMatcher.name, score: 0, ...input };
  }

  const actualObj: Record<string, number> = {};

  for (const item of actual) {
    const str = String(item);
    actualObj[str] = (actualObj[str] ?? 0) + 1;
  }

  let dist = 0;
  for (const item of expected) {
    const str = String(item);
    if (!actualObj[str]) {
      dist++;
    } else {
      actualObj[str]--;
    }
  }

  dist += Object.values(actualObj).reduce((sum, v) => sum + Math.max(v, 0), 0);

  const score = Math.max(1 - dist / expected.length, 0);

  return { check: arrayExactMatcher.name, score, ...input };
}

function omit(input: CheckIn): CheckOut | undefined {
  const { actual, expected } = input;
  const actualFound = actual !== undefined;
  const expectedFound = expected !== undefined;

  if (actualFound && expectedFound) {
    // Need to do match comparison
    return undefined;
  }

  return {
    check: omit.name,
    omit: expectedFound ? "badOmit" : actualFound ? "badFind" : "good",
    ...input,
  };
}

// #endregion

// #region Helpers

function isEqualCaseInsensitive(a: unknown, b: unknown): boolean {
  const aStr = typeof a === "string" ? a.toLowerCase() : a;
  const bStr = typeof b === "string" ? b.toLowerCase() : b;
  return aStr === bStr;
}

// #endregion
