import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager.js";
import type {
  EnvelopeTelemetry,
  EventData,
  ExceptionData,
  ExceptionDetails,
  RequestData,
} from "applicationinsights/out/Declarations/Contracts/index.js";
import type NodeClient from "applicationinsights/out/Library/NodeClient.js";
import { subscribeAsyncLogging } from "dry-utils-async";
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

interface TypedRequestData extends RequestData {
  properties: Bag | unknown[] | undefined;
}
interface TypedEventData extends EventData {
  properties: Bag | unknown[] | undefined;
}
interface TypedExceptionData extends ExceptionData {
  properties: Bag | unknown[] | undefined;
}

let _client: NodeClient;

export function startTelemetry(): void {
  telemetryWorkaround
    .setup(config.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .start();
  _client = telemetryWorkaround.getClient();
  _client.addTelemetryProcessor(telemetryProcessor);
  _client.config.disableAppInsights = config.NODE_ENV === "dev";

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

interface CustomContext extends CorrelationContext {
  requestContext?: Bag;
}

const asyncLocalStorage = new AsyncLocalStorage<Bag>();

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
  // If an async context is already set, use it
  const asyncContext = asyncLocalStorage.getStore();
  if (asyncContext) return asyncContext;

  // Otherwise, use the request-level context
  const context = telemetryWorkaround.getCorrelationContext() as CustomContext;
  if (context) {
    context.requestContext ??= {};
    return context.requestContext;
  }

  // If no context (eg. on startup), return an empty object
  return {};
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

/**
 * Logs client-provided identifiers from request headers into telemetry context.
 * @param headers - Request headers object.
 */
export function logRequestIdentifiers(headers: Bag): void {
  let visitorId = headers["x-vid"];
  visitorId = typeof visitorId === "string" ? visitorId.trim() : "";
  if (visitorId) {
    logProperty("visitorId", visitorId);
  }

  let sessionId = headers["x-session-id"];
  sessionId = typeof sessionId === "string" ? sessionId.trim() : "";
  if (sessionId) {
    logProperty("sessionId", sessionId);
  }
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

// #region (Send) Telemetry Processor

/**
 * Application Insights telemetry processor that enriches telemetry with context
 * @param envelope - Telemetry envelope to process
 * @returns true to allow the event to be sent
 */
export function telemetryProcessor({ data }: EnvelopeTelemetry): boolean {
  try {
    if (!data.baseData) return true;

    switch (data.baseType) {
      case "RequestData": {
        const requestData = data.baseData as TypedRequestData;
        appendContext(requestData);
        devLogRequest(requestData);
        break;
      }
      case "EventData": {
        const eventData = data.baseData as EventData;
        appendContext(eventData);
        devLogEvent(eventData);
        break;
      }
      case "ExceptionData": {
        devLogException(data.baseData as ExceptionData);
        break;
      }
      case "RemoteDependencyData":
      case "MetricData":
        // Uncomment for local debug logging
        // devLog(data.baseData);
        break;
      default:
        // Uncomment for local debug logging
        // devLog(data.baseData);
        break;
    }
  } catch (error) {
    // Can't logError here because it could cause an infinite loop
    console.error(error);
  }
  return true;
}

function appendContext(baseData: TypedRequestData | TypedEventData) {
  const requestData = baseData;
  requestData.properties = {
    ...requestData.properties,
    ...getContext(),
  };
}

// #endregion

// #region Development Logging

function devLogRequest(requestData: TypedRequestData) {
  if (config.NODE_ENV === "dev") {
    const { name, responseCode, duration, properties } = requestData;
    devLog({
      name,
      responseCode,
      duration,
      ...properties,
    });
  }
}

function devLogEvent(eventData: TypedEventData) {
  if (config.NODE_ENV === "dev") {
    const { name, properties } = eventData;
    devLog({ name, ...properties });
  }
}

function devLogException({ exceptions, properties }: TypedExceptionData) {
  if (config.NODE_ENV === "dev") {
    const [first, ...rest] = exceptions;
    const simplify = (ex: ExceptionDetails) => ({
      exception: ex.message,
      stack: ex.stack ?? ex.parsedStack.map((frame) => frame.assembly),
    });

    if (first) {
      if (
        !Array.isArray(properties) &&
        typeof properties?.["cause"] === "string"
      ) {
        try {
          properties["cause"] = JSON.parse(properties["cause"]);
        } catch {
          /* ignore */
        }
      }

      devLog({
        ...simplify(first),
        properties,
        innerExceptions: rest.map(simplify),
      });
    }
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
