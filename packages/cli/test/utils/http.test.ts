import assert from "node:assert/strict";
import { after, suite, test } from "node:test";

const originalAdminToken = process.env.ADMIN_TOKEN;
const originalProdAdminToken = process.env.PROD_ADMIN_TOKEN;
process.env.ADMIN_TOKEN = "test-admin-token-1";
process.env.PROD_ADMIN_TOKEN = "test-prod-token-1";

const { apiCall } = await import("../../src/utils/http.ts");

suite("http apiCall", () => {
  after(() => {
    if (originalAdminToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalAdminToken;
    }

    if (originalProdAdminToken === undefined) {
      delete process.env.PROD_ADMIN_TOKEN;
    } else {
      process.env.PROD_ADMIN_TOKEN = originalProdAdminToken;
    }
  });

  test("builds request with query params, admin auth, and JSON body", async () => {
    const originalFetch = globalThis.fetch;
    let calledUrl: URL | undefined;
    let calledInit: RequestInit | undefined;

    globalThis.fetch = async (input, init) => {
      calledUrl = input as URL;
      calledInit = init;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const result = await apiCall("POST", "jobs", {
        query: { page: "2", sort: "desc" },
        body: { id: "123" },
      });

      assert.equal(
        calledUrl?.toString(),
        "http://localhost:3000/api/jobs?page=2&sort=desc",
      );
      assert.equal(calledInit?.method, "POST");
      assert.deepEqual(calledInit?.headers, {
        Authorization: "Bearer test-admin-token-1",
        "Content-Type": "application/json",
      });
      assert.equal(calledInit?.body, JSON.stringify({ id: "123" }));
      assert.deepEqual(result, {
        status: 200,
        value: { ok: true },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("skips admin auth when asAdmin is false", async () => {
    const originalFetch = globalThis.fetch;
    let calledInit: RequestInit | undefined;

    globalThis.fetch = async (_input, init) => {
      calledInit = init;

      return new Response("done", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    };

    try {
      const result = await apiCall("GET", "jobs", { asAdmin: false });

      assert.deepEqual(calledInit?.headers, {});
      assert.equal(calledInit?.body, undefined);
      assert.deepEqual(result, {
        status: 200,
        value: "done",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("uses prod URL and token when env is prod", async () => {
    const originalFetch = globalThis.fetch;
    let calledUrl: URL | undefined;
    let calledInit: RequestInit | undefined;

    globalThis.fetch = async (input, init) => {
      calledUrl = input as URL;
      calledInit = init;
      return new Response("ok", { status: 200 });
    };

    try {
      const result = await apiCall("GET", "jobs", { env: "prod" });

      assert.equal(
        calledUrl?.toString(),
        "https://api.betterjobboard.net/api/jobs",
      );
      assert.deepEqual(calledInit?.headers, {
        Authorization: "Bearer test-prod-token-1",
      });
      assert.deepEqual(result, { status: 200, value: "ok" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("throws formatted error payload for non-OK responses by default", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ reason: "invalid" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      await assert.rejects(apiCall("GET", "jobs"), {
        name: "Error",
        message: 'Request failed with status 400: {"reason":"invalid"}',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns non-OK response when throwOnError is false", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return new Response("service unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      });
    };

    try {
      const result = await apiCall("GET", "jobs", { throwOnError: false });

      assert.deepEqual(result, {
        status: 503,
        value: "service unavailable",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("falls back to raw text when JSON parsing fails", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return new Response("not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const result = await apiCall("GET", "jobs");

      assert.deepEqual(result, {
        status: 200,
        value: "not-json",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
