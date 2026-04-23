import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import type { CheckOut, Stats } from "../../../src/eval/evalTypes.ts";
import { checksToStats, combineStats } from "../../../src/eval/judge/stats.ts";
import { afterReset } from "../../setup.ts";

after(afterReset);

suite("judge stats", () => {
  test("checksToStats converts match and omit checks into aggregate metrics", () => {
    const checks: CheckOut[] = [
      { check: "c1", prop: "a", actual: "x", expected: "x", score: 1 },
      { check: "c2", prop: "b", actual: "y", expected: "z", score: 0.4 },
      {
        check: "c3",
        prop: "c",
        actual: undefined,
        expected: "z",
        omit: "badOmit",
      },
      {
        check: "c4",
        prop: "d",
        actual: "x",
        expected: undefined,
        omit: "badFind",
      },
      {
        check: "c5",
        prop: "e",
        actual: undefined,
        expected: undefined,
        omit: "good",
      },
    ];

    assert.deepEqual(checksToStats(checks), {
      match: { good: 1, bad: 1, total: 2, score: 0.7 },
      omit: {
        good: 1,
        badFind: 1,
        badOmit: 1,
        total: 3,
        precision: 0.5,
        recall: 0.5,
        f1: 0.5,
      },
      overall: 0.58,
    });
  });

  test("combineStats merges weighted scores and computes overall", () => {
    const statList: Stats[] = [
      {
        match: { good: 2, bad: 0, total: 2, score: 1 },
      },
      {
        match: { good: 0, bad: 1, total: 1, score: 0.2 },
      },
      {
        omit: { good: 3, badFind: 1, badOmit: 0, total: 4 },
      },
    ];

    assert.deepEqual(combineStats(statList), {
      match: { good: 2, bad: 1, total: 3, score: 0.7333 },
      omit: {
        good: 3,
        badFind: 1,
        badOmit: 0,
        total: 4,
        precision: 1,
        recall: 0.75,
        f1: 0.8571,
      },
      overall: 0.804,
    });
  });

  test("combineStats returns zeros when all categories are absent", () => {
    assert.deepEqual(combineStats([]), { overall: 0 });
  });
});
