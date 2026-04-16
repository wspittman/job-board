import { config } from "./config.ts";
import type { ExecutionProfile } from "./types.ts";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Options {
  query?: Record<string, string>;
  body?: unknown;
  asAdmin?: boolean;
  throwOnError?: boolean;
}

interface Result {
  status: number;
  value: unknown;
}

export async function request(
  method: HttpMethod,
  path: string,
  profile: ExecutionProfile,
  { query, body, asAdmin = true, throwOnError = true }: Options = {},
): Promise<Result> {
  const [baseUrl, token] = getUrlAndToken(profile);
  const endpoint = new URL(`${baseUrl}${path}`);
  endpoint.search = new URLSearchParams(query ?? {}).toString();

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

function getUrlAndToken(profile: ExecutionProfile): [string, string] {
  const isProd = profile === "prod";
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
