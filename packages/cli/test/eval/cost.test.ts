import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { cost, costAg, isCostAvailable } from "../../src/eval/cost.ts";
import { LLMAction } from "../../src/portal/pTypes.ts";

const MODEL = "gpt-5-nano";
const COMPANY = "fillCompanyInfo";
const JOB = "fillJobInfo";

suite("cost", () => {
  test("isCostAvailable: returns true for known model and action", () => {
    assert.equal(isCostAvailable(MODEL, COMPANY), true);
  });

  test("isCostAvailable: returns false for unknown model or action", () => {
    assert.equal(isCostAvailable("unknown", COMPANY), false);
    assert.equal(isCostAvailable(MODEL, "unknown" as LLMAction), false);
  });

  test("cost: calculates expected cost for gpt-5-nano and fillCompanyInfo", () => {
    // gpt-5-nano: in=0.05, cache=0.005, out=0.4
    // fillCompanyInfo: cache%=0, canFlex=true
    // (1000 * 0.05 / 1M + 100 * 0.4 / 1M) * 0.5 = (0.00005 + 0.00004) * 0.5 = 0.000045
    assert.equal(
      cost(MODEL, COMPANY, { inTokens: 1000, outTokens: 100 }),
      0.000045,
    );
  });

  test("cost: calculates expected cost for gpt-5-nano and fillJobInfo (with caching)", () => {
    // gpt-5-nano: in=0.05, cache=0.005, out=0.4
    // fillJobInfo: cache%=0.4, canFlex=true
    // inTokens: 1000 => cache=400, uncached=600
    // (600 * 0.05 / 1M + 400 * 0.005 / 1M + 100 * 0.4 / 1M) * 0.5
    // (0.00003 + 0.000002 + 0.00004) * 0.5 = 0.000072 * 0.5 = 0.000036
    assert.equal(
      cost(MODEL, JOB, { inTokens: 1000, outTokens: 100 }),
      0.000036,
    );
  });

  test("cost: handles missing token metrics", () => {
    assert.equal(cost(MODEL, COMPANY, {}), 0);
  });

  test("costAg: aggregates costs and calculates projections", () => {
    // fillCompanyInfo: actionsPerWeek = 25
    const costs = [0.1, 0.2];
    const result = costAg(COMPANY, costs);

    assert.ok(Math.abs(result.cost - 0.3) < 1e-10);
    assert.ok(Math.abs(result.avgCost - 0.15) < 1e-10);
    assert.equal(result.costPerMillion, 150000);
    assert.equal(result.costPerYear, 195); // 0.15 * 25 * 52 = 195
  });

  test("costAg: handles empty costs array", () => {
    const result = costAg(COMPANY, []);
    assert.equal(result.cost, 0);
    assert.equal(result.avgCost, 0);
    assert.equal(result.costPerMillion, 0);
    assert.equal(result.costPerYear, 0);
  });
});
