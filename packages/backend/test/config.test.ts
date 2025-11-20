import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, test } from "node:test";

const originalEnv = { ...process.env };
const VALID_ADMIN_TOKEN = "a".repeat(16);

const importFreshConfig = async () =>
  import(`../src/config.ts?test=${randomUUID()}`);

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("config", () => {
  const invalidAdminTokenCases = [
    {
      name: "missing ADMIN_TOKEN",
      prepareEnv: () => {
        process.env = { ...originalEnv };
        delete process.env.ADMIN_TOKEN;
      },
    },
    {
      name: "short ADMIN_TOKEN",
      prepareEnv: () => {
        process.env = { ...originalEnv, ADMIN_TOKEN: "too-short" };
      },
    },
  ];

  invalidAdminTokenCases.forEach(({ name, prepareEnv }) => {
    test(name, async () => {
      prepareEnv();

      await assert.rejects(importFreshConfig, /ADMIN_TOKEN must be set/);
    });
  });

  test("applies defaults when optional env vars are missing", async () => {
    process.env = { ...originalEnv, ADMIN_TOKEN: VALID_ADMIN_TOKEN };
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.LLM_REASONING_EFFORT;

    const { config } = await importFreshConfig();

    assert.strictEqual(config.PORT, 3000);
    assert.strictEqual(config.NODE_ENV, "dev");
    assert.strictEqual(config.LLM_REASONING_EFFORT, undefined);
  });

  const reasoningEffortCases: [string, string][] = [
    ["minimal", "minimal"],
    ["low", "low"],
    ["medium", "medium"],
    ["high", "high"],
    ["MEDIUM", "medium"],
  ];

  reasoningEffortCases.forEach(([envValue, expected]) => {
    test(`accepts allowed LLM_REASONING_EFFORT value: ${envValue}`, async () => {
      process.env = {
        ...originalEnv,
        ADMIN_TOKEN: VALID_ADMIN_TOKEN,
        LLM_REASONING_EFFORT: envValue,
      };

      const { config } = await importFreshConfig();

      assert.strictEqual(config.LLM_REASONING_EFFORT, expected);
    });
  });

  const invalidReasoningEffort = ["", "extreme", "unknown"];

  invalidReasoningEffort.forEach((envValue) => {
    test(`ignores invalid LLM_REASONING_EFFORT value: ${envValue || "<empty>"}`, async () => {
      process.env = {
        ...originalEnv,
        ADMIN_TOKEN: VALID_ADMIN_TOKEN,
        LLM_REASONING_EFFORT: envValue,
      };

      const { config } = await importFreshConfig();

      assert.strictEqual(config.LLM_REASONING_EFFORT, undefined);
    });
  });

  test("parses numeric PORT values", async () => {
    process.env = {
      ...originalEnv,
      ADMIN_TOKEN: VALID_ADMIN_TOKEN,
      PORT: "4500",
    };

    const { config } = await importFreshConfig();

    assert.strictEqual(config.PORT, 4500);
  });
});
