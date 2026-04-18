import { logger } from "dry-utils-logger";
import { config } from "../config.ts";
import type { ENV, HttpMethod } from "../types.ts";

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
 * Send a request to a backend API.
 * @param method - HTTP method to use for the request.
 * @param path - API path relative to the configured base URL.
 * @param opt - Additional request options.
 * @returns Parsed response from the API.
 */
export async function apiCall(
  method: HttpMethod,
  path: string,
  options: Options = {},
): Promise<Result> {
  const {
    query,
    body,
    asAdmin = true,
    env = "local",
    throwOnError = true,
  } = options;
  const [baseUrl, token] = getUrlAndToken(env);
  const endpoint = new URL(`${baseUrl}${path}`);
  endpoint.search = new URLSearchParams(query ?? {}).toString();

  logger.info(`API Call: ${method} ${endpoint}`);
  logger.debug(`API Options`, options);

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
  const url = isProd ? config.PROD_API_URL : config.API_URL;
  const token = isProd ? config.PROD_ADMIN_TOKEN : config.ADMIN_TOKEN;
  return [url, token ?? ""];
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
