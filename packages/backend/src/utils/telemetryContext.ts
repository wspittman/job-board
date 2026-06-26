import { logger } from "dry-utils-logger";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "../config.ts";
import type { Bag } from "../types/types.ts";

export type TelemetryContextFallback = () => Bag | undefined;

type NumBag = Record<string, number>;
interface AgBag {
  count: number;
  counts: NumBag;
  calls: Bag[];
  metrics: NumBag;
}
interface AgSub {
  tag: string;
  dense: Bag;
  metrics: NumBag;
  blob: Bag;
}

const asyncLocalStorage = new AsyncLocalStorage<Bag>();
let fallbackContext: TelemetryContextFallback | undefined;

/**
 * Sets the request-scoped context provider used when no async local context is active.
 * @param fallback Provider that returns the current request telemetry context.
 */
export function setTelemetryContextFallback(
  fallback: TelemetryContextFallback,
): void {
  fallbackContext = fallback;
}

/**
 * Executes an async function within a new telemetry context.
 * @param fn Async function to execute.
 * @returns The resolved value from the async function.
 */
export function withTelemetryContext<T>(fn: () => Promise<T>): Promise<T> {
  return asyncLocalStorage.run({}, fn);
}

/**
 * Executes an async function within a local telemetry context and logs the
 * captured summary when the function settles.
 * @param name Name of the operation for the log summary.
 * @param fn Async function to execute.
 * @returns The resolved value from the async function.
 * @remarks Intended for in-process callers, such as CLI portal functions, that
 * need backend telemetry context without starting Application Insights.
 */
export function withLocalTelemetryContext<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  const context: Bag = {};

  return asyncLocalStorage.run(context, async () => {
    try {
      return await fn();
    } finally {
      logger.debug(new Date().toISOString(), {
        name,
        duration: Date.now() - start,
        ...context,
      });
    }
  });
}

/**
 * Gets the current telemetry context, initializing fallback request context when needed.
 * @returns The current mutable telemetry context.
 */
export function getTelemetryContext(): Bag {
  const asyncContext = asyncLocalStorage.getStore();
  if (asyncContext) return asyncContext;

  return fallbackContext?.() ?? {};
}

/**
 * Gets a named sub-section of the telemetry context.
 * @param name Name of the sub-context.
 * @param base Initial value if sub-context does not exist.
 * @returns The requested sub-context.
 */
export function getTelemetrySubContext<T>(name: string, base: T): T {
  const context = getTelemetryContext();
  context[name] ??= base;
  return context[name] as T;
}

/**
 * Logs a property to the current telemetry context.
 * @param name Name of the property.
 * @param value Value to log.
 * @remarks If property already exists, converts to array of values.
 */
export function logProperty(name: string, value: unknown): void {
  const context = getTelemetrySubContext<Bag>("prop", {});

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
 * Increments a counter in the current telemetry context.
 * @param name Name of the counter.
 * @param value Amount to increment by.
 */
export function logCounter(name: string, value: number = 1): void {
  const context = getTelemetryContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

/**
 * Creates a subscriber aggregator for telemetry events.
 * @param source Name of the sub-context to use.
 * @param callLimit Maximum number of calls to include verbatim.
 * @returns A function that accepts telemetry events.
 */
export function createSubscribeAggregator(
  source: string,
  callLimit: number,
): (sub: AgSub) => void {
  return ({ tag, dense, metrics, blob }: AgSub) => {
    const ag = getTelemetrySubContext<AgBag>(source, {
      count: 0,
      counts: {},
      calls: [],
      metrics: {},
    });

    ag.count++;
    ag.counts[tag] = (ag.counts[tag] ?? 0) + 1;

    if (ag.calls.length < callLimit) {
      ag.calls.push(dense);
    }

    Object.entries(metrics).forEach(([key, val]) => {
      ag.metrics[key] = (ag.metrics[key] ?? 0) + val;
    });

    if (config.ENABLE_VERBOSE_BLOB_LOGGING) {
      logger.debug("Aggregator Blob", blob);
    }
  };
}
