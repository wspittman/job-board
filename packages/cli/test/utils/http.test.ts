import assert from "node:assert/strict";
import { after, suite, test } from "node:test";
import { apiCall } from "../../src/utils/http.ts";
import {
  afterReset,
  mockFetch,
  TEST_ADMIN_TOKEN,
  TEST_PROD_ADMIN_TOKEN,
} from "../setup.ts";

after(afterReset);

suite("http apiCall", () => {
  test("builds request with query params, admin auth, and JSON body", async () => {
    const fetchMock = mockFetch(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await apiCall("POST", "jobs", {
      query: { page: "2", sort: "desc" },
      body: { id: "123" },
    });

    const [calledUrl, calledInit] = fetchMock.calls[0].arguments;

    assert.equal(
      calledUrl?.toString(),
      "http://localhost:3000/api/jobs?page=2&sort=desc",
    );
    assert.equal(calledInit?.method, "POST");
    assert.deepEqual(calledInit?.headers, {
      Authorization: `Bearer ${TEST_ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    });
    assert.equal(calledInit?.body, JSON.stringify({ id: "123" }));
    assert.deepEqual(result, {
      status: 200,
      value: { ok: true },
    });
  });

  test("skips admin auth when asAdmin is false", async () => {
    const fetchMock = mockFetch(async () => {
      return new Response("done", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    });

    const result = await apiCall("GET", "jobs", { asAdmin: false });

    const [, calledInit] = fetchMock.calls[0].arguments;

    assert.deepEqual(calledInit?.headers, {});
    assert.equal(calledInit?.body, undefined);
    assert.deepEqual(result, {
      status: 200,
      value: "done",
    });
  });

  test("uses prod URL and token when env is prod", async () => {
    const fetchMock = mockFetch(async () => {
      return new Response("ok", { status: 200 });
    });

    const result = await apiCall("GET", "jobs", { env: "prod" });

    const [calledUrl, calledInit] = fetchMock.calls[0].arguments;

    assert.equal(
      calledUrl?.toString(),
      "https://api.betterjobboard.net/api/jobs",
    );
    assert.deepEqual(calledInit?.headers, {
      Authorization: `Bearer ${TEST_PROD_ADMIN_TOKEN}`,
    });
    assert.deepEqual(result, { status: 200, value: "ok" });
  });

  test("throws formatted error payload for non-OK responses by default", async () => {
    mockFetch(async () => {
      return new Response(JSON.stringify({ reason: "invalid" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    });

    await assert.rejects(apiCall("GET", "jobs"), {
      name: "Error",
      message: 'Request failed with status 400: {"reason":"invalid"}',
    });
  });

  test("returns non-OK response when throwOnError is false", async () => {
    mockFetch(async () => {
      return new Response("service unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      });
    });

    const result = await apiCall("GET", "jobs", { throwOnError: false });

    assert.deepEqual(result, {
      status: 503,
      value: "service unavailable",
    });
  });

  test("falls back to raw text when JSON parsing fails", async () => {
    mockFetch(async () => {
      return new Response("not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const result = await apiCall("GET", "jobs");

    assert.deepEqual(result, {
      status: 200,
      value: "not-json",
    });
  });
});
