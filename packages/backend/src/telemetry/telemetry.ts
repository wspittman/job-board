import { subscribeAsyncLogging } from "dry-utils-async";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Bag, NumBag } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";

// #region Types and Startup

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

interface TelemetryConfig {
  baseContext?: () => Bag | undefined;
  trackEvent?: (name: string, duration: number) => void;
  trackError?: (error: Error, props?: Bag | string[]) => void;
}

const asyncLocalStorage = new AsyncLocalStorage<Bag>();

let _external: TelemetryConfig = {};

export function configureTelemetry(config: TelemetryConfig): void {
  _external = config;
}

subscribeAsyncLogging({
  log: ({ tag, val }) => logProperty(tag, val),
  error: ({ tag, val }) => logError(new Error(tag, { cause: val })),
});

// #endregion

// #region Context Management

/**
 * Executes an async function within a new telemetry context
 * @param name Name of the operation for tracking
 * @param fn Async function to execute
 * @returns The resolved value from the async function, or undefined if we caught an error
 * @remarks Automatically tracks duration and errors
 */
export function withAsyncContext<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  const start = Date.now();
  return asyncLocalStorage.run({}, async () => {
    try {
      return await fn();
    } catch (error) {
      logError(error);
      return undefined;
    } finally {
      const duration = Date.now() - start;
      _external.trackEvent?.(name, duration);
    }
  });
}

/**
 * Get the current logging context, initializing it if necessary
 */
export function getContext(): Bag {
  // If an async context is already set, use it
  const asyncContext = asyncLocalStorage.getStore();
  if (asyncContext) return asyncContext;

  // Otherwise, use the request-level context
  // If no context (eg. on startup), return an empty object
  const context = _external.baseContext?.();
  return context ?? {};
}

/**
 * Gets a named sub-section of the telemetry context
 * @param name Name of the sub-context
 * @param base Initial value if sub-context does not exist
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
 * @param name Name of the property
 * @param value Value to log
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
 * @param name Name of the counter
 * @param value Amount to increment by (default: 1)
 */
export function logCounter(name: string, value: number = 1): void {
  const context = getContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

/**
 * Logs an error to Application Insights
 * @param error Error to log
 */
export function logError(error: unknown): void {
  const exception = error instanceof Error ? error : new Error(String(error));

  let properties = undefined;

  if (error instanceof AppError) {
    properties = error.toErrorList();
  } else if (error instanceof Error) {
    properties = { cause: error.cause };
  }

  _external.trackError?.(exception, properties);
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
 * @param source Name of the sub-context to use
 * @param callLimit Maximum number of calls to include verbatim
 * @returns A function that accepts telemetry events
 */
export function createSubscribeAggregator(
  source: string,
  callLimit: number,
): (sub: AgSub) => void {
  return ({ tag, dense, metrics /*, blob*/ }: AgSub) => {
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

    /*if (config.ENABLE_VERBOSE_BLOB_LOGGING) {
      // TBD: Sent to a blob storage DB
      logger.debug("Aggregator Blob", blob);
    }*/
  };
}

// #endregion
