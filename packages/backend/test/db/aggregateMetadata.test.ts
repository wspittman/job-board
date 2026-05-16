import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { calcPercentile, computeSalaryStats } from "../../src/db/db.ts";

suite("calcPercentile", () => {
  test("returns the single element for a one-item array", () => {
    assert.equal(calcPercentile([100], 50), 100);
  });

  test("returns exact boundary values", () => {
    const sorted = [10, 20, 30, 40, 50];
    assert.equal(calcPercentile(sorted, 0), 10);
    assert.equal(calcPercentile(sorted, 100), 50);
  });

  test("interpolates between values", () => {
    // [10, 20]: median idx = 0.5 → 10 + (20-10)*0.5 = 15
    assert.equal(calcPercentile([10, 20], 50), 15);
  });

  test("rounds to nearest integer", () => {
    // [10, 11]: p50 idx = 0.5 → 10 + 1*0.5 = 10.5 → rounds to 11
    assert.equal(calcPercentile([10, 11], 50), 11);
  });

  test("computes quartiles for even-length array", () => {
    const sorted = [10, 20, 30, 40];
    // p25 idx = 0.75 → 10 + 10*0.75 = 17.5 → 18
    assert.equal(calcPercentile(sorted, 25), 18);
    // p50 idx = 1.5 → 20 + 10*0.5 = 25
    assert.equal(calcPercentile(sorted, 50), 25);
    // p75 idx = 2.25 → 30 + 10*0.25 = 32.5 → 33
    assert.equal(calcPercentile(sorted, 75), 33);
  });
});

suite("computeSalaryStats", () => {
  /** Builds 10 rows for the given family and annual salary amount. */
  function makeRows(
    jobFamily: string | undefined,
    salary: number,
    count = 10,
  ): {
    jobFamily?: string;
    salaryRange?: { cadence?: string; min?: number; max?: number };
  }[] {
    return Array.from({ length: count }, () => ({
      jobFamily,
      salaryRange: { cadence: "salary", min: salary, max: salary },
    }));
  }

  test("returns empty array when no rows", () => {
    assert.deepEqual(computeSalaryStats([]), []);
  });

  test("skips rows with non-salary cadence", () => {
    const rows = makeRows("engineering", 100_000);
    rows.forEach((r) => {
      r.salaryRange!.cadence = "hourly";
    });
    assert.deepEqual(computeSalaryStats(rows), []);
  });

  test("skips rows with no positive salary endpoints", () => {
    const rows = makeRows("engineering", 0);
    assert.deepEqual(computeSalaryStats(rows), []);
  });

  test("omits buckets with fewer than 10 samples", () => {
    const rows = makeRows("engineering", 100_000, 9);
    assert.deepEqual(computeSalaryStats(rows), []);
  });

  test("emits overall bucket and family bucket when count >= 10", () => {
    const rows = makeRows("engineering", 100_000);
    const stats = computeSalaryStats(rows);
    assert.equal(stats.length, 2);

    const overall = stats.find((s) => s.jobFamily === undefined);
    assert.ok(overall, "overall bucket present");
    assert.equal(overall!.count, 10);
    assert.equal(overall!.median, 100_000);

    const eng = stats.find((s) => s.jobFamily === "engineering");
    assert.ok(eng, "engineering bucket present");
    assert.equal(eng!.count, 10);
  });

  test("uses midpoint when both min and max are set", () => {
    const rows = Array.from({ length: 10 }, () => ({
      jobFamily: undefined,
      salaryRange: { cadence: "salary", min: 80_000, max: 120_000 },
    }));
    const [bucket] = computeSalaryStats(rows);
    assert.equal(bucket!.median, 100_000);
  });

  test("uses min when max is missing", () => {
    const rows = Array.from({ length: 10 }, () => ({
      jobFamily: undefined,
      salaryRange: { cadence: "salary", min: 90_000, max: 0 },
    }));
    const [bucket] = computeSalaryStats(rows);
    assert.equal(bucket!.median, 90_000);
  });

  test("uses max when min is missing", () => {
    const rows = Array.from({ length: 10 }, () => ({
      jobFamily: undefined,
      salaryRange: { cadence: "salary", min: 0, max: 110_000 },
    }));
    const [bucket] = computeSalaryStats(rows);
    assert.equal(bucket!.median, 110_000);
  });

  test("drops family bucket with unknown JobFamily enum value", () => {
    const rows = makeRows("not_a_valid_family", 100_000);
    const stats = computeSalaryStats(rows);
    // Overall bucket is still emitted; family bucket for invalid key is not
    assert.equal(stats.length, 1);
    assert.equal(stats[0]!.jobFamily, undefined);
  });

  test("multiple families produce separate buckets", () => {
    const rows = [
      ...makeRows("engineering", 120_000),
      ...makeRows("design", 90_000),
    ];
    const stats = computeSalaryStats(rows);
    assert.equal(stats.length, 3); // overall + engineering + design

    const engBucket = stats.find((s) => s.jobFamily === "engineering");
    assert.ok(engBucket);
    assert.equal(engBucket!.median, 120_000);

    const desBucket = stats.find((s) => s.jobFamily === "design");
    assert.ok(desBucket);
    assert.equal(desBucket!.median, 90_000);
  });

  test("overall bucket aggregates all families", () => {
    const rows = [
      ...makeRows("engineering", 100_000),
      ...makeRows("design", 200_000),
    ];
    const stats = computeSalaryStats(rows);
    const overall = stats.find((s) => s.jobFamily === undefined)!;
    assert.equal(overall.count, 20);
    // Sorted midpoints: ten 100k then ten 200k → median is avg of 10th and 11th = 150k
    assert.equal(overall.median, 150_000);
  });
});
