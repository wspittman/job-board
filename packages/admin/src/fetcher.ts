import { config } from "./config.ts";
import type { HttpMethod } from "./types.ts";

type ENV = "prod" | "local";

interface Options {
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
 * Send a request to the backend API using the admin CLI configuration.
 * @param method - HTTP method to use for the request.
 * @param path - API path relative to the configured base URL.
 * @param opt - Additional request options.
 * @returns Parsed response from the API.
 */
export async function fetcher(
  method: HttpMethod,
  path: string,
  { body, asAdmin = true, env = "prod", throwOnError = true }: Options = {},
): Promise<Result> {
  const [baseUrl, token] = getUrlAndToken(env);
  const endpoint = new URL(`${baseUrl}${path}`).toString();

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
