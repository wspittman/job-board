import * as appInsights from "applicationinsights";
import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager";
import type {
  EnvelopeTelemetry,
  EventData,
  ExceptionData,
  RequestData,
} from "applicationinsights/out/Declarations/Contracts";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "../config";

interface CustomContext extends CorrelationContext {
  requestContext?: Record<string, unknown>;
}

const asyncLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

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

export function getSubContext<T>(name: string, init: () => T): T {
  const context = getContext();
  context[name] ??= init();
  return <T>context[name];
}

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

export function logCounter(name: string, value: number = 1) {
  const context = getContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

export function logError(error: unknown) {
  const exception = error instanceof Error ? error : new Error(String(error));
  appInsights.defaultClient.trackException({ exception });
}

/**
 * Put the request context onto the customDimensions of the request event
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
    devLog(
      exceptions.map((exception) => ({
        exception: exception.message,
        stack:
          exception.stack ??
          exception.parsedStack.map((frame) => frame.assembly),
      }))
    );
  }
}

function devLog(data: unknown) {
  if (config.NODE_ENV === "dev") {
    console.dir(data, { depth: null });
  }
}

// #endregion
