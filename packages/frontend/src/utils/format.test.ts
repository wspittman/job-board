import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { fmt } from "./format";

const NOW = new Date("2026-05-14T12:00:00Z").getTime();

suite("fmt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(vi.useRealTimers);

  test("number: defaults to 0", () => {
    expect(fmt.number()).toBe("0");
  });

  test.for([
    [0, "0"],
    [1_000, "1K"],
    [1_500_000, "1.5M"],
  ] as [number, string][])("number(%s) → %s", ([value, expected]) => {
    expect(fmt.number(value)).toBe(expected);
  });

  test("percent: defaults to 0%", () => {
    expect(fmt.percent()).toBe("0%");
  });

  test.for([
    [0, 0, "0%"],
    [0, 100, "0%"],
    [5, 0, "0%"],
    [25, 100, "25%"],
    [100, 100, "100%"],
    [-5, 10, "0%"],
  ] as [number, number, string][])(
    "percent(%s, %s) → %s",
    ([value, total, expected]) => {
      expect(fmt.percent(value, total)).toBe(expected);
    },
  );

  test("daysAgo: returns 'Just Posted' when less than one full day has passed", () => {
    expect(fmt.daysAgo(0)).toBe("Just Posted");
  });

  test.for([1, 3, 6])("daysAgo: %d days ago → 'Past Week'", (days) => {
    expect(fmt.daysAgo(days)).toBe("Past Week");
  });

  test("daysAgo: 7+ days ago returns a relative string beyond 'Past Week'", () => {
    const result = fmt.daysAgo(7);
    expect(result).toBeTypeOf("string");
    expect(result).not.toBe("Just Posted");
    expect(result).not.toBe("Past Week");
  });

  test("daysAgo: 30 days ago returns a relative string", () => {
    const result = fmt.daysAgo(30);
    expect(result).toBeTypeOf("string");
    expect(result).not.toBe("Just Posted");
    expect(result).not.toBe("Past Week");
  });

  test("dateTime: returns a non-empty string", () => {
    expect(fmt.dateTime(NOW)).toBeTypeOf("string");
    expect(fmt.dateTime(NOW).length).toBeGreaterThan(0);
  });

  test("date: returns a non-empty string", () => {
    expect(fmt.date(NOW)).toBeTypeOf("string");
    expect(fmt.date(NOW).length).toBeGreaterThan(0);
  });

  test("currency: includes a dollar sign", () => {
    expect(fmt.currency(1_000)).toContain("$");
  });

  test("currency: uses compact notation for thousands", () => {
    expect(fmt.currency(1_000)).toContain("K");
  });

  test("currency: formats zero as a string", () => {
    expect(fmt.currency(0)).toBeTypeOf("string");
  });
});
