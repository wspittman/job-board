import { configureGlobal } from "dry-utils-logger";
import express from "express";
import { beforeEach, mock } from "node:test";
import { Bag } from "../src/types/types.ts";

configureGlobal({
  filename: "logs/test.log",
});

process.env.ADMIN_TOKEN ??= "test-admin-token-123456";
process.env.NODE_ENV ??= "test";
process.env.OPENAI_API_KEY ??= "test-openai-key-123456";

// #region Telemetry

const telemetryWorkaround = (
  await import("../src/telemetry/telemetryWorkaround.cjs")
).default;

const telemetryClient = {
  addTelemetryProcessor: () => {},
  config: { disableAppInsights: true },
};

export let telemetryContext: Bag = {};

// no-op telemetry bootstrap
mock.method(telemetryWorkaround, "setup", () => ({ start() {} }));

mock.method(telemetryWorkaround, "getClient", () => telemetryClient);

mock.method(
  telemetryWorkaround,
  "getCorrelationContext",
  () => telemetryContext,
);

beforeEach(() => {
  telemetryContext = {};
});

// #endregion

const database = await import("../src/db/db.ts");
mock.method(database.db, "connect", async () => {});

mock.method(express.application, "listen", () => ({
  close() {
    // no-op server stub
  },
}));
