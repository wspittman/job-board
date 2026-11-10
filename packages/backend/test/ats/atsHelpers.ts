import assert from "node:assert/strict";
import { mockFetch } from "../setup.ts";

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export function getFetchCall(
  fetchMock: ReturnType<typeof mockFetch>,
  index = 0,
) {
  const call = fetchMock.mock.calls[index];
  assert.ok(call);
  const [url, init] = call.arguments as [string, RequestInit];
  return { url, init };
}
