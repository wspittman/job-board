import { configureGlobal } from "dry-utils-logger";
import { mock } from "node:test";

export const TEST_ADMIN_TOKEN = "test-admin-token-123456";
export const TEST_PROD_ADMIN_TOKEN = "test-prod-token-123456";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

export function setEnv(extras: Record<string, string | undefined> = {}) {
  process.env = {
    ...originalEnv,
    ADMIN_TOKEN: TEST_ADMIN_TOKEN,
    PROD_ADMIN_TOKEN: TEST_PROD_ADMIN_TOKEN,
    ...extras,
  };
}

export function mockFetch(impl: typeof globalThis.fetch) {
  const fn = mock.fn(impl);
  globalThis.fetch = fn;
  return fn.mock;
}

export function afterReset() {
  process.env = originalEnv;
  globalThis.fetch = originalFetch;
}

configureGlobal({
  consoleLevel: "crit",
  filename: "logs/test.log",
});

setEnv();
mockFetch(mock.fn());
