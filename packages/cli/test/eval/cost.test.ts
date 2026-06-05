import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import { cost, costAg, isCostAvailable } from "../../src/eval/cost.ts";
import { LLMAction } from "../../src/portal/pTypes.ts";
import { afterReset } from "../setup.ts";

after(afterReset);

const MODEL = "gpt-5-nano";
const COMPANY = "fillCompanyInfo";
const JOB = "fillJobInfo";

suite("cost", () => {
  const assertCurrencyEstimate = (value: number) => {
    assert.equal(Number.isFinite(value), true);
    assert.equal(value, Number(value.toFixed(8)));
  };

  test("isCostAvailable: returns true for known model and action", () => {
    assert.equal(isCostAvailable(MODEL, COMPANY), true);
  });

  test("isCostAvailable: returns false for unknown model or action", () => {
    assert.equal(isCostAvailable("unknown", COMPANY), false);
    assert.equal(isCostAvailable(MODEL, "unknown" as LLMAction), false);
  });

  test("cost: returns a positive truncated estimate for token usage", () => {
    const result = cost(MODEL, COMPANY, { inTokens: 1000, outTokens: 100 });

    assert.ok(result > 0);
    assertCurrencyEstimate(result);
  });

  test("cost: increases as token usage grows", () => {
    const lowerUsageCost = cost(MODEL, JOB, { inTokens: 1000 });
    const higherUsageCost = cost(MODEL, JOB, { inTokens: 2000 });

    assert.ok(higherUsageCost > lowerUsageCost);
    assertCurrencyEstimate(higherUsageCost);
  });

  test("cost: handles missing token metrics", () => {
    assert.equal(cost(MODEL, COMPANY, {}), 0);
  });

  test("costAg: aggregates costs and calculates table-based projections", () => {
    const costs = [0.1, 0.2];
    const result = costAg(COMPANY, costs);

    assert.ok(Math.abs(result.cost - 0.3) < 1e-10);
    assert.ok(Math.abs(result.avgCost - 0.15) < 1e-10);
    assert.equal(result.costPerMillion, 150000);
    assert.equal(Number.isFinite(result.costPerYear), true);
    assert.ok(result.costPerYear >= 0);
    assert.equal(result.costPerYear, Number(result.costPerYear.toFixed(2)));
  });

  test("costAg: handles empty costs array", () => {
    const result = costAg(COMPANY, []);
    assert.equal(result.cost, 0);
    assert.equal(result.avgCost, 0);
    assert.equal(result.costPerMillion, 0);
    assert.equal(result.costPerYear, 0);
  });
});
