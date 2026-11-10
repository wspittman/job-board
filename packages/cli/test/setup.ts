import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { afterEach, mock } from "node:test";
import { fileURLToPath } from "node:url";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

export function setEnv(extras: Record<string, string | undefined> = {}) {
  process.env = { ...originalEnv, ...extras };
}

export function mockFetch(impl: typeof globalThis.fetch) {
  const fn = mock.fn(impl);
  globalThis.fetch = fn;
  return fn.mock;
}

/** Absolute path to the CLI logs directory used by all file-based tests. */
export const logBasePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../logs",
);

/**
 * Creates a tracked list of file paths that are automatically removed after each test.
 * @returns An array to push file paths into; cleaned up via afterEach.
 */
export function makeFileTracker(): string[] {
  const tracked: string[] = [];
  afterEach(async () => {
    await Promise.all(tracked.splice(0).map((f) => rm(f, { force: true })));
  });
  return tracked;
}

/**
 * Creates a tracked list of directory paths that are automatically removed after each test.
 * @returns An array to push directory paths into; cleaned up via afterEach.
 */
export function makeDirTracker(): string[] {
  const tracked: string[] = [];
  afterEach(async () => {
    await Promise.all(
      tracked.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });
  return tracked;
}

export function afterReset() {
  process.env = originalEnv;
  globalThis.fetch = originalFetch;
}

setEnv();
mockFetch(mock.fn());
