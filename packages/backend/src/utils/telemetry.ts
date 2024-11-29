import * as appInsights from "applicationinsights";
import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager";
import type {
  EnvelopeTelemetry,
  EventData,
  ExceptionData,
  RequestData,
} from "applicationinsights/out/Declarations/Contracts";
import { config } from "../config";

interface CustomContext extends CorrelationContext {
  requestContext?: Record<string, unknown>;
}

/**
 * Get the request context from the correlation context, initializing it if necessary
 * @returns The request context
 */
function getRequestContext(): Record<string, unknown> {
  const context = <CustomContext>appInsights.getCorrelationContext();
  context.requestContext ??= {};
  return context.requestContext;
}

export function getSubContext<T>(name: string, init: () => T): T {
  const context = getRequestContext();
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
  const context = getRequestContext();
  context[name] = ((context[name] as number) ?? 0) + value;
}

export function logAsyncEvent(name: string, duration: number) {
  const context = getRequestContext();
  context.duration = duration;
  appInsights.defaultClient.trackEvent({ name: `Async: ${name}` });
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
    ...getRequestContext(),
  };
}

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
