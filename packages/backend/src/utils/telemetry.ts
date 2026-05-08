import {
  SpanKind,
  context,
  trace,
  type AttributeValue,
} from "@opentelemetry/api";
import type {
  ReadableSpan,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { TelemetryClient } from "applicationinsights";
import { subscribeAsyncLogging } from "dry-utils-async";
import type { NextFunction, Request, Response } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "../config.ts";
import { AppError } from "./AppError.ts";
/*
A workaround for Application Insights defaultClient issue with requires CommonJS-style lazy loading.
In ESM environments, the module loader enumerates all exported properties during initialization.
This means that the getter for defaultClient is executed before the client is initialized by setup().
Consequently, defaultClient remains undefined even after setup() is called.
https://github.com/microsoft/ApplicationInsights-node.js/issues/1354
*/
import type { Bag } from "../types/types.ts";
import telemetryWorkaround from "./telemetryWorkaround.cjs";

// #region Types and Startup

let _client: TelemetryClient;

export function startTelemetry(): void {
  const appInsights = telemetryWorkaround.setup(
    config.APPLICATIONINSIGHTS_CONNECTION_STRING,
  );
  appInsights.setAzureMonitorOptions({
    spanProcessors: [new TelemetryContextProcessor()],
    // HTTP auto-instrumentation is disabled because requestSpanMiddleware creates
    // SERVER spans manually (Node v24 ESM incompatibility with IIMT). CLIENT spans
    // from outbound http calls are also suppressed to avoid noise; add individual
    // dependency tracking via logProperty/trackDependency as needed.
    instrumentationOptions: { http: { enabled: false } },
  });
  appInsights.start();
  _client = telemetryWorkaround.getClient();
  if (config.NODE_ENV === "dev") {
    _client.config.samplingPercentage = 0;
  }

  subscribeAsyncLogging({
    log: ({ tag, val }) => logProperty(tag, val),
    error: ({ tag, val }) => logError(new Error(tag, { cause: val })),
  });
}

type NumBag = Record<string, number>;
interface AgBag {
  count: number;
  counts: NumBag;
  calls: Bag[];
  metrics: NumBag;
}
interface LogSub {
  tag: string;
  val: unknown;
}
interface AgSub {
  tag: string;
  dense: Bag;
  metrics: NumBag;
  blob: Bag;
}

export const asyncLocalStorage = new AsyncLocalStorage<Bag>();

// #endregion

// #region Context Management

/**
 * Executes an async function within a new telemetry context
 * @param name - Name of the operation for tracking
 * @param fn - Async function to execute
 * @returns Promise that resolves when the function completes
 * @remarks Automatically tracks duration and errors
 */
export function withAsyncContext(
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  return asyncLocalStorage.run({}, async () => {
    try {
      await fn();
    } catch (error) {
      logError(error);
    } finally {
      const duration = Date.now() - start;
      _client?.trackEvent({ name, properties: { duration } });
    }
  });
}

/**
 * Get the current logging context, initializing it if necessary
 */
function getContext(): Bag {
  return asyncLocalStorage.getStore() ?? {};
}

/**
 * Gets a named sub-section of the telemetry context
 * @param name - Name of the sub-context
 * @param base - Initial value if sub-context does not exist
 * @returns The requested sub-context
 */
function getSubContext<T>(name: string, base: T): T {
  const context = getContext();
  context[name] ??= base;
  return context[name] as T;
}

// #endregion

// #region Logging Functions

/**
 * Logs a property to the current telemetry context
 * @param name - Name of the property
 * @param value - Value to log
 * @remarks If property already exists, converts to array of values
 */
export function logProperty(name: string, value: unknown): void {
  const context = getSubContext<Bag>("prop", {});

  if (name in context) {
    const current = context[name];

    if (Array.isArray(current) && !Array.isArray(value)) {
      current.push(value);
    } else {
      context[name] = [current, value];
    }
  } else {
    context[name] = value;
  }
}

/**
 * Increments a counter in the current telemetry context
 * @param name - Name of the counter
 * @param value - Amount to increment by (default: 1)
 */
export function logCounter(name: string, value: number = 1): void {
  const context = getContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

/**
 * Logs an error to Application Insights
 * @param error - Error to log
 */
export function logError(error: unknown): void {
  const exception = error instanceof Error ? error : new Error(String(error));

  let properties = undefined;

  if (error instanceof AppError) {
    properties = error.toErrorList();
  } else if (error instanceof Error) {
    properties = { cause: error.cause };
  }

  _client?.trackException({ exception, properties });
}

// #endregion

// #region Dry-Utils Subscribers

/**
 * Helper to translate dry-utils subscribers to logProperty calls
 */
export function subscribeLog({ tag, val }: LogSub): void {
  logProperty(tag, val);
}

/**
 * Helper to translate dry-utils subscribers to logError calls
 */
export function subscribeError({ tag, val }: LogSub): void {
  logError(new Error(tag, { cause: val }));
}

/**
 * Creates a subscriber aggregator for telemetry events
 * @param source - Name of the sub-context to use
 * @param callLimit - Maximum number of calls to include verbatim
 * @returns A function that accepts telemetry events
 */
export function createSubscribeAggregator(
  source: string,
  callLimit: number,
): (sub: AgSub) => void {
  return ({ tag, dense, metrics, blob }: AgSub) => {
    const ag = getSubContext<AgBag>(source, {
      count: 0,
      counts: {},
      calls: [],
      metrics: {},
    });

    if (!ag) return;

    ag.count++;
    ag.counts[tag] = (ag.counts[tag] ?? 0) + 1;

    if (ag.calls.length < callLimit) {
      ag.calls.push(dense);
    }

    Object.entries(metrics).forEach(([key, val]) => {
      ag.metrics[key] = (ag.metrics[key] ?? 0) + val;
    });

    if (config.ENABLE_VERBOSE_BLOB_LOGGING) {
      // TBD: Sent to a blob storage DB
      console.dir(blob, { depth: null });
    }
  };
}

// #endregion

// #region Request Span Middleware

/*
 * OTel's HTTP auto-instrumentation does not produce SERVER spans in Node v24 ESM
 * because import-in-the-middle's async worker-thread hook patches the ESM-facing
 * namespace's Server prototype, while Node's internal HTTP implementation uses the
 * original unproxied prototype for emitting `request` events.
 *
 * This middleware creates SERVER spans manually so that:
 * - TelemetryContextProcessor.onEnd enriches them with request-scoped properties
 * - devLogSpan logs them locally in dev mode
 * - They are exported to Application Insights in production
 *
 * Remove this middleware if OTel resolves ESM/Node v24 SERVER span auto-instrumentation.
 */
export function requestSpanMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const tracer = trace.getTracer("express");
  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      "http.method": req.method,
      "http.target": req.path,
      "http.url": req.url,
    },
  });

  res.on("finish", () => {
    span.setAttribute("http.response.status_code", res.statusCode);
    span.end();
  });

  context.with(trace.setSpan(context.active(), span), next);
}

// #endregion

// #region OTel SpanProcessor

/**
 * OTel SpanProcessor that enriches spans with request-scoped telemetry context
 * and handles dev-mode console logging.
 */
class TelemetryContextProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onStart(): void {}

  onEnd(span: ReadableSpan): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      for (const [key, value] of Object.entries(store)) {
        span.attributes[key] =
          typeof value === "object" && value !== null && !Array.isArray(value)
            ? JSON.stringify(value)
            : (value as AttributeValue);
      }
    }
    devLogSpan(span, store);
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

// #endregion

// #region Development Logging

function devLogSpan(span: ReadableSpan, store: Bag | undefined): void {
  if (config.NODE_ENV !== "dev") return;
  if (span.kind !== SpanKind.SERVER) return;

  const durationMs = span.duration[0] * 1000 + span.duration[1] / 1_000_000;
  const props = store?.["prop"] as Bag | undefined;

  const exceptionEvents = span.events.filter((e) => e.name === "exception");
  if (exceptionEvents.length > 0) {
    for (const evt of exceptionEvents) {
      devLog({
        name: span.name,
        exception: evt.attributes?.["exception.message"],
        stack: evt.attributes?.["exception.stacktrace"],
        ...(props ?? {}),
      });
    }
  } else {
    devLog({
      name: span.name,
      statusCode:
        span.attributes["http.response.status_code"] ??
        span.attributes["http.status_code"],
      durationMs: Math.round(durationMs),
      ...(props ?? {}),
    });
  }
}

function devLog(data: object) {
  if (config.NODE_ENV === "dev") {
    console.dir(
      {
        timestamp: new Date().toISOString(),
        ...data,
      },
      { depth: null },
    );
  }
}

// #endregion
