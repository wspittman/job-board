import { config } from "./config.ts";
import type { HttpMethod } from "../shared/types.ts";

export type Environment = "prod" | "local";

interface RequestOptions {
  query?: Record<string, string>;
  body?: unknown;
  env?: Environment;
}

export interface FetchResult {
  status: number;
  value: unknown;
}

/**
 * Sends a request to the backend API with configured credentials.
 */
export async function apiFetch(
  method: HttpMethod,
  path: string,
  { query, body, env = "local" }: RequestOptions = {},
): Promise<FetchResult> {
  const [baseUrl, token] = getUrlAndToken(env);
  const endpoint = new URL(`${baseUrl}${path}`);
  endpoint.search = new URLSearchParams(query ?? {}).toString();

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const value = await parseResponse(response);

  if (!response.ok) {
    const errorMessage = value ? JSON.stringify(value) : response.statusText;
    throw new Error(
      `Request failed with status ${response.status}: ${errorMessage}`,
    );
  }

  return { status: response.status, value };
}

function getUrlAndToken(env: Environment): [string, string] {
  const isProd = env === "prod";
  const url = isProd ? config.PROD_API_BASE_URL : config.LOCAL_API_BASE_URL;
  const token = isProd ? config.PROD_API_TOKEN : config.LOCAL_API_TOKEN;
  return [url, token];
}

async function parseResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return responseText;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}
