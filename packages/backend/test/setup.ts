import { configureGlobal } from "dry-utils-logger";
import { beforeEach, mock } from "node:test";
import { configureTelemetry } from "../src/telemetry/telemetry.ts";
import { Bag } from "../src/types/types.ts";

configureGlobal({
  filename: "logs/test.log",
});

process.env.ADMIN_TOKEN ??= "test-admin-token-123456";
process.env.NODE_ENV ??= "test";
process.env.OPENAI_API_KEY ??= "test-openai-key-123456";
const { db } = await import("../src/db/db.ts");

/** The context where tested code stores telemetry properties */
export let telemetryContext: Bag = {};
configureTelemetry({ baseContext: () => telemetryContext });

/** Mocks the global fetch with a provided implementation and returns the mock for examination. */
export function mockFetch(impl: typeof globalThis.fetch) {
  const fn = mock.fn(impl);
  globalThis.fetch = fn;
  return fn;
}

export async function mockDBContent(content: Record<string, unknown>) {
  await db.connect(JSON.stringify(content));
}

beforeEach(() => {
  telemetryContext = {};
});
