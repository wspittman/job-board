import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import type { Judgement, Rubric } from "../../src/eval/evalTypes.ts";
import { aggregate, judge } from "../../src/eval/judge.ts";
import {
  arrayExactMatcher,
  equals,
  equalsCasePreferred,
} from "../../src/eval/judge/checks.ts";
import type { Bag } from "../../src/types.ts";
import { afterReset } from "../setup.ts";

after(afterReset);

suite("judge", () => {
  test("judge computes stats and includes only suboptimal checks", async () => {
    const actual: Bag = {
      role: "Remote",
      location: "seattle",
      tags: ["typescript", "react"],
      missingField: "extra",
    };
    const expected: Bag = {
      role: "remote",
      location: "Seattle",
      tags: ["typescript", "node", "react"],
      notFound: "required",
    };

    const rubric: Rubric<Bag> = {
      role: equalsCasePreferred,
      location: equals,
      tags: arrayExactMatcher,
      missingField: equals,
      notFound: equals,
    };

    const out = await judge(actual, expected, rubric);

    assert.deepEqual(out, {
      match: {
        good: 1,
        bad: 2,
        total: 3,
        score: 0.5,
      },
      omit: {
        good: 0,
        badFind: 1,
        badOmit: 1,
        total: 2,
        precision: 0,
        recall: 0,
        f1: 0,
      },
      overall: 0.3,
      suboptimal: [
        {
          check: "equals",
          prop: "location",
          actual: "seattle",
          expected: "Seattle",
          score: 0,
        },
        {
          check: "arrayExactMatcher",
          prop: "tags",
          actual: ["typescript", "react"],
          expected: ["typescript", "node", "react"],
          score: 0.6666666666666667,
        },
        {
          check: "omit",
          prop: "missingField",
          actual: "extra",
          expected: undefined,
          omit: "badFind",
        },
        {
          check: "omit",
          prop: "notFound",
          actual: undefined,
          expected: "required",
          omit: "badOmit",
        },
      ],
    });
  });

  test("aggregate combines multiple judgments", () => {
    const judgments: Judgement[] = [
      {
        match: { good: 1, bad: 0, total: 1, score: 1 },
        omit: { good: 1, badFind: 0, badOmit: 0, total: 1, f1: 1 },
        overall: 1,
      },
      {
        match: { good: 0, bad: 1, total: 1, score: 0.2 },
        omit: { good: 0, badFind: 1, badOmit: 1, total: 2, f1: 0 },
        overall: 0.0667,
      },
    ];

    assert.deepEqual(aggregate(judgments), {
      match: { good: 1, bad: 1, total: 2, score: 0.6 },
      omit: {
        good: 1,
        badFind: 1,
        badOmit: 1,
        total: 3,
        precision: 0.5,
        recall: 0.5,
        f1: 0.5,
      },
      overall: 0.54,
    });
  });
});
