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
import { logger } from "dry-utils-logger";
import { config } from "../config.ts";
import type { Bag } from "../types/types.ts";
import { AppError } from "./AppError.ts";
import {
  getTelemetryContext,
  logProperty,
  setTelemetryContextFallback,
  withTelemetryContext,
} from "./telemetryContext.ts";
export {
  createSubscribeAggregator,
  getTelemetryContext,
  getTelemetrySubContext,
  logCounter,
  logProperty,
  setTelemetryContextFallback,
  withLocalTelemetryContext,
  withTelemetryContext,
} from "./telemetryContext.ts";

/*
A workaround for Application Insights defaultClient issue with requires CommonJS-style lazy loading.
In ESM environments, the module loader enumerates all exported properties during initialization.
This means that the getter for defaultClient is executed before the client is initialized by setup().
Consequently, defaultClient remains undefined even after setup() is called.
https://github.com/microsoft/ApplicationInsights-node.js/issues/1354
*/
import telemetryWorkaround from "./telemetryWorkaround.cjs";

interface TypedRequestData extends RequestData {
  properties: Bag | unknown[] | undefined;
}
interface TypedEventData extends EventData {
  properties: Bag | unknown[] | undefined;
}
interface TypedExceptionData extends ExceptionData {
  properties: Bag | unknown[] | undefined;
}
interface LogSub {
  tag: string;
  val: unknown;
}
interface CustomContext extends CorrelationContext {
  requestContext?: Bag;
}

let _client: NodeClient;

configureApplicationInsightsContext();

function configureApplicationInsightsContext(): void {
  setTelemetryContextFallback(() => {
    const context =
      telemetryWorkaround.getCorrelationContext() as CustomContext;
    if (!context) return undefined;

    context.requestContext ??= {};
    return context.requestContext;
  });
}

export function startTelemetry(): void {
  telemetryWorkaround
    .setup(config.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .start();
  _client = telemetryWorkaround.getClient();
  _client.addTelemetryProcessor(telemetryProcessor);
  _client.config.disableAppInsights = config.NODE_ENV === "dev";

  subscribeAsyncLogging({
    log: subscribeLog,
    error: subscribeError,
  });
}

/**
 * Executes an async function within a new telemetry context.
 * @param name Name of the operation for tracking.
 * @param fn Async function to execute.
 * @returns The resolved value from the async function.
 * @remarks Automatically tracks duration and logs errors without rethrowing them.
 */
export function withAsyncContext(
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  return withTelemetryContext(async () => {
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
 * Logs an error to Application Insights.
 * @param error Error to log.
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
 * Helper to translate dry-utils subscribers to logProperty calls.
 */
export function subscribeLog({ tag, val }: LogSub): void {
  logProperty(tag, val);
}

/**
 * Helper to translate dry-utils subscribers to logError calls.
 */
export function subscribeError({ tag, val }: LogSub): void {
  logError(new Error(tag, { cause: val }));
}

/**
 * Application Insights telemetry processor that enriches telemetry with context.
 * @param envelope Telemetry envelope to process.
 * @returns true to allow the event to be sent.
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
    logger.error("telemetryProcessor", error);
  }
  return true;
}

function appendContext(baseData: TypedRequestData | TypedEventData) {
  const requestData = baseData;
  requestData.properties = {
    ...requestData.properties,
    ...getTelemetryContext(),
  };
}

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
    logger.info(new Date().toISOString(), data);
  }
}
