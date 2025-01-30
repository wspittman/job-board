import * as appInsights from "applicationinsights";
import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager";
import type {
  EnvelopeTelemetry,
  EventData,
  ExceptionData,
  ExceptionDetails,
  RequestData,
} from "applicationinsights/out/Declarations/Contracts";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "../config";

interface CustomContext extends CorrelationContext {
  requestContext?: Record<string, unknown>;
}

const asyncLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

/**
 * Executes an async function within a new telemetry context
 * @param name - Name of the operation for tracking
 * @param fn - Async function to execute
 * @remarks Automatically tracks duration and errors
 */
export function withAsyncContext(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  asyncLocalStorage.run({}, async () => {
    try {
      await fn();
    } catch (error) {
      logError(error);
    } finally {
      const duration = Date.now() - start;
      appInsights.defaultClient.trackEvent({ name, properties: { duration } });
    }
  });
}

/**
 * Get the current logging context, initializing it if necessary
 */
function getContext(): Record<string, unknown> {
  // If an async context is already set, use it
  const asyncContext = asyncLocalStorage.getStore();
  if (asyncContext) return asyncContext;

  // Otherwise, use the request-level context
  const context = <CustomContext>appInsights.getCorrelationContext();
  context.requestContext ??= {};
  return context.requestContext;
}

/**
 * Gets a named sub-section of the telemetry context
 * @param name - Name of the sub-context
 * @param init - Function to initialize the sub-context if it doesn't exist
 * @returns The requested sub-context
 */
export function getSubContext<T>(name: string, init: () => T): T {
  const context = getContext();
  context[name] ??= init();
  return <T>context[name];
}

/**
 * Logs a property to the current telemetry context
 * @param name - Name of the property
 * @param value - Value to log
 * @remarks If property already exists, converts to array of values
 */
export function logProperty(name: string, value: unknown) {
  const context = getSubContext<Record<string, unknown>>("prop", () => ({}));

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
export function logCounter(name: string, value: number = 1) {
  const context = getContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

/**
 * Logs an error to Application Insights
 * @param error - Error to log
 */
export function logError(error: unknown) {
  const exception = error instanceof Error ? error : new Error(String(error));
  appInsights.defaultClient.trackException({ exception });
}

/**
 * Application Insights telemetry processor that enriches telemetry with context
 * @param envelope - Telemetry envelope to process
 * @returns true to allow the event to be sent
 */
export function telemetryProcessor({ data }: EnvelopeTelemetry) {
  try {
    if (!data.baseData) return true;

    switch (data.baseType) {
      case "RequestData":
        const requestData = data.baseData as RequestData;
        appendContext(requestData);
        devLogRequest(requestData);
        break;
      case "EventData":
        const eventData = data.baseData as EventData;
        appendContext(eventData);
        devLogEvent(eventData);
        break;
      case "ExceptionData":
        devLogException(data.baseData as ExceptionData);
        break;
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

function appendContext(baseData: RequestData | EventData) {
  const requestData = baseData;
  requestData.properties = {
    ...requestData.properties,
    ...getContext(),
  };
}

// #region Development Logging

function devLogRequest(requestData: RequestData) {
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

function devLogEvent(eventData: EventData) {
  if (config.NODE_ENV === "dev") {
    const { name, properties } = eventData;
    devLog({ name, ...properties });
  }
}

function devLogException({ exceptions }: ExceptionData) {
  if (config.NODE_ENV === "dev") {
    const [first, ...rest] = exceptions;
    const simplify = (ex: ExceptionDetails) => ({
      exception: ex.message,
      stack: ex.stack ?? ex.parsedStack.map((frame) => frame.assembly),
    });

    devLog({
      ...simplify(first),
      innerExceptions: rest.map(simplify),
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
      { depth: null }
    );
  }
}

// #endregion
