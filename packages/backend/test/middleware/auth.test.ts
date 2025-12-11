import type { Request, Response } from "express";
import assert from "node:assert/strict";
import { beforeEach, mock, suite, test } from "node:test";
import { adminOnly } from "../../src/middleware/auth";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const unauthorizedJson = { message: "Unauthorized" };

function mockRequest(authHeader?: string): Request {
  return {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? authHeader : undefined;
    },
  } as Request;
}

suite("adminOnly", () => {
  const statusFn = mock.fn(() => res);
  const jsonFn = mock.fn(() => res);
  const res: Response = {
    status: statusFn,
    json: jsonFn,
  } as unknown as Response;
  const next = mock.fn();

  beforeEach(() => {
    statusFn.mock.resetCalls();
    jsonFn.mock.resetCalls();
    next.mock.resetCalls();
  });

  const rejectCases: [string, string | undefined][] = [
    ["no header", undefined],
    ["missing token", "Bearer"],
    ["incorrect length", "Bearer short-token"],
    ["incorrect content", `Bearer ${"x".repeat(ADMIN_TOKEN.length)}`],
  ];

  rejectCases.forEach(([name, header]) => {
    test(`Rejects requests with ${name}`, () => {
      adminOnly(mockRequest(header), res, next);

      assert.equal(statusFn.mock.callCount(), 1);
      assert.equal(jsonFn.mock.callCount(), 1);
      assert.equal(next.mock.callCount(), 0);

      assert.equal(statusFn.mock.calls[0]?.arguments.at(0), 401);
      assert.deepEqual(jsonFn.mock.calls[0]?.arguments.at(0), unauthorizedJson);
    });
  });

  test("Allows requests with valid bearer token", () => {
    adminOnly(mockRequest(`Bearer ${ADMIN_TOKEN}`), res, next);

    assert.equal(statusFn.mock.callCount(), 0);
    assert.equal(jsonFn.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 1);
  });
});
