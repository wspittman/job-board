import express from "express";
import { mock } from "node:test";

process.env.ADMIN_TOKEN ??= "test-admin-token-123456";
process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ??= "";
process.env.NODE_ENV ??= "test";

const telemetryWorkaround = (await import("../src/utils/telemetryWorkaround.cjs")).default;
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
