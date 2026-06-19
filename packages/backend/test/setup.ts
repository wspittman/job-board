import { configureGlobal } from "dry-utils-logger";
import express from "express";
import { mock } from "node:test";

configureGlobal({
  filename: "logs/test.log",
});

process.env.ADMIN_TOKEN ??= "test-admin-token-123456";
process.env.NODE_ENV ??= "test";
process.env.OPENAI_API_KEY ??= "test-openai-key-123456";

const telemetryWorkaround = (
  await import("../src/utils/telemetryWorkaround.cjs")
).default;
const telemetryClient = {
  addTelemetryProcessor: () => {},
  config: { disableAppInsights: true },
};

mock.method(telemetryWorkaround, "setup", () => ({
  start() {
    // no-op telemetry bootstrap
  },
}));

mock.method(telemetryWorkaround, "getClient", () => telemetryClient);

const database = await import("../src/db/db.ts");
mock.method(database.db, "connect", async () => {});

mock.method(express.application, "listen", () => ({
  close() {
    // no-op server stub
  },
}));
