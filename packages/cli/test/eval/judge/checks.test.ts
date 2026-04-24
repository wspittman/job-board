import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import type { CheckIn, CheckOut, Rubric } from "../../../src/eval/evalTypes.ts";
import {
  arrayExactMatcher,
  equals,
  equalsCasePreferred,
  equalsUrl,
  runChecks,
  similar,
} from "../../../src/eval/judge/checks.ts";
import { Bag } from "../../../src/types.ts";
import { embedCache } from "../../../src/utils/embedCache.ts";
import { afterReset } from "../../setup.ts";

after(afterReset);

const BAD_OMIT: Partial<CheckOut> = { check: "omit", omit: "badOmit" };

function formChecks(
  check: string,
  expected: unknown,
  ...cases: [unknown, Partial<CheckOut> | number][]
): [CheckIn, CheckOut][] {
  // Add exact match and undefined cases to the provided cases
  cases = [[expected, 1], ...cases, [undefined, BAD_OMIT]];
  return cases.map(([a, res]) => {
    const checkIn = { prop: `${a} vs ${expected}`, actual: a, expected };
    res = typeof res === "number" ? { score: res } : res;
    const checkOut = { check, ...checkIn, ...res };
    return [checkIn, checkOut];
  });
}

suite("checks", () => {
  const equalsCases = formChecks("equals", "x", ["y", 0]);

  equalsCases.forEach(([input, expected]) => {
    test(`equals: ${input.prop}`, () => {
      const result = equals(input);
      assert.deepEqual(result, expected);
    });
  });

  const equalsCasePreferredCases = formChecks(
    "equalsCasePreferred",
    "remote",
    ["REMOTE", 0],
    ["ReMoTe", 0.5],
    ["onsite", 0],
  );

  equalsCasePreferredCases.forEach(([input, expected]) => {
    test(`equalsCasePreferred: ${input.prop}`, () => {
      const result = equalsCasePreferred(input);
      assert.deepEqual(result, expected);
    });
  });

  const equalsUrlCases = formChecks(
    "equalsUrl",
    "https://jobs.example.com/engineering/123?source=ats",
    ["https://jobs.example.com/engineering/123?x=1", 0.5],
    ["https://sub.jobs.example.com/other", 0.25],
    ["https://another.example.org/role", 0],
  );

  equalsUrlCases.forEach(([input, expected]) => {
    test(`equalsUrl: ${input.prop}`, () => {
      const result = equalsUrl(input);
      assert.deepEqual(result, expected);
    });
  });

  const arrayExactMatcherCases = formChecks(
    "arrayExactMatcher",
    ["a", "b", "c", "d"],
    [["a", "b", "c"], 0.75],
    ["a", 0],
  );

  arrayExactMatcherCases.forEach(([input, expected]) => {
    test(`arrayExactMatcher: ${input.prop}`, () => {
      const result = arrayExactMatcher(input);
      assert.deepEqual(result, expected);
    });
  });

  const similarCases: [CheckIn, CheckOut][] = formChecks(
    "similar",
    "[0.6, -0.8]",
    // This case might cause problems re: rounding
    ["[-0.3855, -0.9145]", 0.5003],
    ["[0.8, 0.6]", 0],
    ["[-0.6, 0.8]", 0],
    ["[]", 0],
  );

  similarCases.forEach(([input, expected]) => {
    test(`similar: ${input.prop}`, async (t) => {
      t.mock.method(embedCache, "getEmbeddings", async () => [
        JSON.parse(input.actual as string),
        JSON.parse(input.expected as string),
      ]);

      const result = await similar(input);
      assert.deepEqual(result, expected);
    });
  });

  test("runChecks walks nested rubric paths and preserves check outputs", async () => {
    const actual: Bag = {
      company: { name: "Acme", about: "hello" },
      tags: ["remote", "typescript", "react"],
    };
    const expected: Bag = {
      company: { name: "acme", about: "hello" },
      tags: ["remote", "typescript", "react", "full-time"],
    };

    const rubric: Rubric<Bag> = {
      company: {
        name: equalsCasePreferred,
        about: equals,
      },
      tags: arrayExactMatcher,
    };

    const out = await runChecks(actual, expected, rubric);

    assert.deepEqual(out, [
      {
        check: "equalsCasePreferred",
        prop: "company.name",
        actual: "Acme",
        expected: "acme",
        score: 0.75,
      },
      {
        check: "equals",
        prop: "company.about",
        actual: "hello",
        expected: "hello",
        score: 1,
      },
      {
        check: "arrayExactMatcher",
        prop: "tags",
        actual: actual.tags,
        expected: expected.tags,
        score: 0.75,
      },
    ]);
  });
});
