import assert from "node:assert/strict";
import { beforeEach, suite, test } from "node:test";
import {
  configureTelemetry,
  createSubscribeAggregator,
  getContext,
  logCounter,
  logError,
  logProperty,
  subscribeError,
  subscribeLog,
  withAsyncContext,
} from "../../src/telemetry/telemetry.ts";
import type { Bag } from "../../src/types/types.ts";
import { AppError } from "../../src/utils/AppError.ts";

interface EventCall {
  name: string;
  duration: number;
}

interface ErrorCall {
  error: Error;
  props?: Bag | string[];
}

suite("telemetry", () => {
  let baseContext: Bag;
  let eventCalls: EventCall[];
  let errorCalls: ErrorCall[];

  beforeEach(() => {
    baseContext = {};
    eventCalls = [];
    errorCalls = [];

    configureTelemetry({
      baseContext: () => baseContext,
      trackEvent: (name, duration) => {
        eventCalls.push({ name, duration });
      },
      trackError: (error, props) => {
        errorCalls.push({ error, props });
      },
    });
  });

  test("logging helpers write to the configured base context", () => {
    logProperty("Input", { ats: "greenhouse", id: "company" });
    logProperty("Input", { full: true });
    logProperty("Input", "retry");
    logCounter("CacheHit");
    logCounter("CacheHit", 2);

    assert.deepEqual(baseContext, {
      prop: {
        Input: [{ ats: "greenhouse", id: "company" }, { full: true }, "retry"],
      },
      CacheHit: 3,
    });
  });

  test("subscriber helpers translate logs and errors", () => {
    subscribeLog({ tag: "company", val: "acme" });
    subscribeError({ tag: "FetchFailed", val: { status: 500 } });

    assert.deepEqual(baseContext, {
      prop: {
        company: "acme",
      },
    });
    assert.equal(errorCalls.length, 1);
    assert.equal(errorCalls[0]?.error.message, "FetchFailed");
    assert.deepEqual(errorCalls[0]?.props, {
      cause: { status: 500 },
    });
  });

  test("createSubscribeAggregator counts calls, limits dense logging, and sums metrics", () => {
    const aggregate = createSubscribeAggregator("ats", 2);

    aggregate({
      tag: "greenhouse GET Jobs",
      dense: { name: "GET Jobs", ats: "greenhouse", id: "company" },
      metrics: { ms: 25, records: 10 },
      blob: { ignored: true },
    });
    aggregate({
      tag: "greenhouse GET Jobs",
      dense: { name: "GET Jobs", ats: "greenhouse", id: "company" },
      metrics: { ms: 35, records: 15 },
      blob: { ignored: true },
    });
    aggregate({
      tag: "lever GET Jobs",
      dense: { name: "GET Jobs", ats: "lever", id: "company" },
      metrics: { ms: 40, records: 8 },
      blob: { ignored: true },
    });

    assert.deepEqual(baseContext, {
      ats: {
        count: 3,
        counts: {
          "greenhouse GET Jobs": 2,
          "lever GET Jobs": 1,
        },
        calls: [
          { name: "GET Jobs", ats: "greenhouse", id: "company" },
          { name: "GET Jobs", ats: "greenhouse", id: "company" },
        ],
        metrics: {
          ms: 100,
          records: 33,
        },
      },
    });
  });

  test("withAsyncContext returns callback value, captures an isolated context, and tracks duration", async () => {
    const aggregate = createSubscribeAggregator("ats", 2);
    let capturedContext: Bag | undefined;

    baseContext = { outside: true };

    const result = await withAsyncContext("FetchCompanyJobs", async () => {
      logProperty("Input", { ats: "greenhouse", id: "company" });
      logProperty("Input", { full: true });
      logCounter("CacheHit");
      logCounter("CacheHit", 2);
      aggregate({
        tag: "greenhouse GET Jobs",
        dense: { name: "GET Jobs", ats: "greenhouse", id: "company" },
        metrics: { ms: 25 },
        blob: { ignored: true },
      });
      capturedContext = getContext();
      return { total: 13, fresh: 9 };
    });

    assert.deepEqual(result, { total: 13, fresh: 9 });
    assert.deepEqual(baseContext, { outside: true });
    assert.deepEqual(capturedContext, {
      prop: {
        Input: [{ ats: "greenhouse", id: "company" }, { full: true }],
      },
      CacheHit: 3,
      ats: {
        count: 1,
        counts: {
          "greenhouse GET Jobs": 1,
        },
        calls: [{ name: "GET Jobs", ats: "greenhouse", id: "company" }],
        metrics: {
          ms: 25,
        },
      },
    });
    assert.equal(eventCalls.length, 1);
    assert.equal(eventCalls[0]?.name, "FetchCompanyJobs");
    assert.equal(typeof eventCalls[0]?.duration, "number");
  });

  test("withAsyncContext logs callback errors, tracks duration, and returns undefined", async () => {
    const error = new Error("Call failed", { cause: "timeout" });

    const result = await withAsyncContext("FetchCompanyJobs", async () => {
      logProperty("Input", { ats: "greenhouse", id: "missing-company" });
      throw error;
    });

    assert.equal(result, undefined);
    assert.deepEqual(errorCalls, [
      {
        error,
        props: { cause: "timeout" },
      },
    ]);
    assert.equal(eventCalls.length, 1);
    assert.equal(eventCalls[0]?.name, "FetchCompanyJobs");
    assert.equal(typeof eventCalls[0]?.duration, "number");
  });

  test("logError forwards AppError details and normalizes unknown values", () => {
    const appError = new AppError(
      "GetCachedLocation",
      500,
      new AppError("Cosmos failure", 503, "partition unavailable"),
    );

    logError(appError);
    logError("Unexpected string");

    assert.equal(errorCalls.length, 2);
    assert.equal(errorCalls[0]?.error, appError);
    assert.deepEqual(errorCalls[0]?.props, [
      "[500] GetCachedLocation",
      "[503] Cosmos failure",
      "partition unavailable",
    ]);
    assert.equal(errorCalls[1]?.error.message, "Unexpected string");
    assert.equal(errorCalls[1]?.props, undefined);
  });
});
