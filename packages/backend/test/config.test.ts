import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, suite, test } from "node:test";

const originalEnv = { ...process.env };
const VALID_ADMIN_TOKEN = "a".repeat(16);

const importFreshConfig = async () =>
  import(`../src/config.ts?test=${randomUUID()}`);
const setEnv = (extras: Record<string, string | undefined> = {}) =>
  (process.env = { ...originalEnv, ...extras });

suite("config", () => {
  beforeEach(() => setEnv());
  afterEach(() => setEnv());

  const invalidAdminTokenCases: [string, string | undefined][] = [
    ["Missing", undefined],
    ["Too short", "too-short"],
  ];

  invalidAdminTokenCases.forEach(([name, adminToken]) => {
    test(`Invalid ADMIN_TOKEN: "${name}"`, async () => {
      setEnv({ ADMIN_TOKEN: adminToken });
      await assert.rejects(importFreshConfig, /ADMIN_TOKEN/);
    });
  });

  test("applies defaults when optional env vars are missing", async () => {
    setEnv({
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      PORT: undefined,
      NODE_ENV: undefined,
      LLM_REASONING_EFFORT: undefined,
    });

    const { config } = await importFreshConfig();

    assert.equal(config.PORT, 3000);
    assert.equal(config.NODE_ENV, "dev");
    assert.equal(config.LLM_REASONING_EFFORT, undefined);
  });

  const reasoningEffortCases: [string, string][] = [
    ["minimal", "minimal"],
    ["low", "low"],
    ["medium", "medium"],
    ["high", "high"],
    ["MEDIUM", "medium"],
  ];

  reasoningEffortCases.forEach(([envValue, expected]) => {
    test(`LLM_REASONING_EFFORT: "${envValue}"`, async () => {
      setEnv({
        ADMIN_TOKEN: VALID_ADMIN_TOKEN,
        LLM_REASONING_EFFORT: envValue,
      });

      const { config } = await importFreshConfig();

      assert.equal(config.LLM_REASONING_EFFORT, expected);
    });
  });

  const invalidReasoningEffort = ["", "extreme", "unknown"];

  invalidReasoningEffort.forEach((envValue) => {
    test(`Invalid LLM_REASONING_EFFORT: "${envValue}"`, async () => {
      setEnv({
        ADMIN_TOKEN: VALID_ADMIN_TOKEN,
        LLM_REASONING_EFFORT: envValue,
      });

      const { config } = await importFreshConfig();

      assert.equal(config.LLM_REASONING_EFFORT, undefined);
    });
  });

  test("parses numeric PORT values", async () => {
    setEnv({
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      PORT: "4500",
    });

    const { config } = await importFreshConfig();

    assert.equal(config.PORT, 4500);
  });

  test("getLLMOptions returns default model and effort", async () => {
    setEnv({
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      LLM_MODEL: "gpt-4-turbo",
      LLM_REASONING_EFFORT: "medium",
    });

    const { getLLMOptions } = await importFreshConfig();
    const options = getLLMOptions("testOp");

    assert.deepEqual(options, {
      model: "gpt-4-turbo",
      reasoningEffort: "medium",
    });
  });

  test("getLLMOptions applies model and effort overrides", async () => {
    setEnv({
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      LLM_MODEL: "gpt-4-turbo",
      LLM_REASONING_EFFORT: "medium",
      LLM_MODEL_OVERRIDES: JSON.stringify({
        testOp: "gpt-o1",
      }),
      LLM_REASONING_EFFORT_OVERRIDES: JSON.stringify({
        testOp: "high",
      }),
    });

    const { getLLMOptions } = await importFreshConfig();

    // With override
    assert.deepEqual(getLLMOptions("testOp"), {
      model: "gpt-o1",
      reasoningEffort: "high",
    });

    // Without override
    assert.deepEqual(getLLMOptions("otherOp"), {
      model: "gpt-4-turbo",
      reasoningEffort: "medium",
    });
  });

  test("invalid LLM_REASONING_EFFORT_OVERRIDES throws", async () => {
    setEnv({
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      LLM_REASONING_EFFORT_OVERRIDES: JSON.stringify({
        testOp: "extreme",
      }),
    });

    await assert.rejects(importFreshConfig, /LLM_REASONING_EFFORT_OVERRIDES/);
  });
});
