import * as appInsights from "applicationinsights";
import type { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager";
import { config } from "../config";

type RequestData = appInsights.Contracts.RequestData;
type ExceptionData = appInsights.Contracts.ExceptionData;

interface CustomContext extends CorrelationContext {
  requestContext?: Record<string, unknown>;
}

/**
 * Get the request context from the correlation context, initializing it if necessary
 * @returns The request context
 */
export function getRequestContext(): Record<string, unknown> {
  const context = <CustomContext>appInsights.getCorrelationContext();
  context.requestContext ??= {};
  return context.requestContext;
}

export function logError(exception: Error) {
  appInsights.defaultClient.trackException({ exception });
}

/**
 * Put the request context onto the customDimensions of the request event
 */
export function telemetryProcessor({
  data,
}: appInsights.Contracts.EnvelopeTelemetry) {
  try {
    if (data.baseType === "RequestData" && data.baseData) {
      const requestData = data.baseData as RequestData;
      requestData.properties = {
        ...requestData.properties,
        ...getRequestContext(),
      };
      devLogRequest(requestData);
    } else if (data.baseType === "ExceptionData" && data.baseData) {
      devLogException(data.baseData as ExceptionData);
    }
  } catch (error) {
    logError(error as Error);
  }
  return true;
}

function devLogRequest(requestData: RequestData) {
  if (config.NODE_ENV === "dev") {
    const { name, responseCode, duration, properties } = requestData;
    console.dir(
      {
        name,
        responseCode,
        duration,
        ...properties,
      },
      { depth: null }
    );
  }
}

function devLogException({ exceptions }: ExceptionData) {
  if (config.NODE_ENV === "dev") {
    console.dir(
      exceptions.map((exception) => ({
        exception: exception.message,
        stack:
          exception.stack ??
          exception.parsedStack.map((frame) => frame.assembly),
      })),
      { depth: null }
    );
  }
}
