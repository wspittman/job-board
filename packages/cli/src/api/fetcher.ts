import { logger } from "dry-utils-logger";
import { config } from "./config.ts";
import {
  getProductionConfirmationPhrase,
  getRuntimeContext,
} from "../runtime.ts";
import type { HttpMethod } from "./types.ts";

type ENV = "prod" | "local";

interface Options {
  query?: Record<string, string>;
  body?: unknown;
  asAdmin?: boolean;
  env?: ENV;
  throwOnError?: boolean;
}

interface Result {
  status: number;
  value: unknown;
}

/**
 * Send a request to the backend API using CLI configuration.
 * @param method - HTTP method to use for the request.
 * @param path - API path relative to the configured base URL.
 * @param opt - Additional request options.
 * @returns Parsed response from the API.
 */
export async function fetcher(
  method: HttpMethod,
  path: string,
  { query, body, asAdmin = true, env, throwOnError = true }: Options = {},
): Promise<Result> {
  const runtime = getRuntimeContext();
  const resolvedEnv = env ?? runtime.apiEnv;

  validateProductionExecution(resolvedEnv);

  const [baseUrl, token] = getUrlAndToken(resolvedEnv);
  const endpoint = new URL(`${baseUrl}${path}`);
  endpoint.search = new URLSearchParams(query ?? {}).toString();

  if (runtime.dryRun) {
    logger.info("Dry run request", {
      method,
      endpoint: endpoint.toString(),
      hasAuthorization: asAdmin,
      body,
    });

    return { status: 204, value: { dryRun: true } };
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      ...(asAdmin ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const value = await parseResponse(response);

  if (!response.ok && throwOnError) {
    const errorMessage = value ? JSON.stringify(value) : response.statusText;
    throw new Error(
      `Request failed with status ${response.status}: ${errorMessage}`,
    );
  }

  return { value, status: response.status };
}

function validateProductionExecution(env: ENV): void {
  if (env !== "prod") {
    return;
  }

  const runtime = getRuntimeContext();

  if (!runtime.allowProduction) {
    throw new Error("Production execution requires --allow-production.");
  }

  if (runtime.productionConfirmation !== getProductionConfirmationPhrase()) {
    throw new Error(
      "Production execution requires --confirm-production I_UNDERSTAND_PRODUCTION_CHANGES.",
    );
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const value = contentType.includes("application/json")
    ? (safeJsonParse(responseText) ?? responseText)
    : responseText;

  return value;
}

function getUrlAndToken(env: ENV): [string, string] {
  const isProd = env === "prod";
  const url = isProd ? config.PROD_API_BASE_URL : config.LOCAL_API_BASE_URL;
  const token = isProd ? config.PROD_API_TOKEN : config.LOCAL_API_TOKEN;
  return [url, token];
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
