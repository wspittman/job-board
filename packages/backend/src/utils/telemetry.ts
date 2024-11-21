import * as appInsights from "applicationinsights";
import { CorrelationContext } from "applicationinsights/out/AutoCollection/CorrelationContextManager";

interface RequestContext {
  [key: string]: unknown;
}

interface CustomContext extends CorrelationContext {
  requestContext?: RequestContext;
}

/**
 * Get the request context from the correlation context, initializing it if necessary
 * @returns The request context
 */
function getRequestContext(): RequestContext {
  const context = <CustomContext>appInsights.getCorrelationContext();
  context.requestContext ??= {};
  return context.requestContext;
}

export function setRequestContext(key: string, value: unknown) {
  getRequestContext()[key] = value;
}

/**
 * Put the request context onto the customDimensions of the request event
 */
export function telemetryProcessor({
  data,
}: appInsights.Contracts.EnvelopeTelemetry) {
  try {
    if (data.baseType === "RequestData" && data.baseData) {
      const requestData = data.baseData as appInsights.Contracts.RequestData;
      requestData.properties = {
        ...requestData.properties,
        ...getRequestContext(),
      };
    }
  } catch (error) {
    console.error("telemetryProcessor error:", error);
  }
  return true;
}
