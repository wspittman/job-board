import { configureGlobal } from "dry-utils-logger";
import express from "express";
import { afterEach, beforeEach, mock } from "node:test";
import { configureTelemetry } from "../src/telemetry/telemetry.ts";
import { Bag } from "../src/types/types.ts";

configureGlobal({
  filename: "logs/test.log",
});

process.env.ADMIN_TOKEN ??= "test-admin-token-123456";
process.env.NODE_ENV ??= "test";
process.env.OPENAI_API_KEY ??= "test-openai-key-123456";

// #region Telemetry

export let telemetryContext: Bag = {};

configureTelemetry({ baseContext: () => telemetryContext });

beforeEach(() => {
  telemetryContext = {};
});

// #endregion

// #region Fetch

const originalFetch = globalThis.fetch;

export function mockFetch(impl: typeof globalThis.fetch) {
  const fn = mock.fn(impl);
  globalThis.fetch = fn;
  return fn;
}

// #endregion

const database = await import("../src/db/db.ts");
mock.method(database.db, "connect", async () => {});

mock.method(express.application, "listen", () => ({
  close() {
    // no-op server stub
  },
}));

afterEach(() => {
  globalThis.fetch = originalFetch;
});
