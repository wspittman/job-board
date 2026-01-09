import type { Request, Response } from "express";
import assert from "node:assert/strict";
import { beforeEach, mock, suite, test } from "node:test";
import { adminOnly } from "../../src/middleware/auth.ts";
import { AppError } from "../../src/utils/AppError.ts";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function mockRequest(authHeader?: string): Request {
  return {
    header(name: string) {
      return name.toLowerCase() === "authorization" ? authHeader : undefined;
    },
  } as Request;
}

suite("adminOnly", () => {
  const res: Response = {} as unknown as Response;
  const next = mock.fn();

  beforeEach(() => {
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

      assert.equal(next.mock.callCount(), 1);
      const err = next.mock.calls[0]?.arguments.at(0);
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.message, "Unauthorized");
    });
  });

  test("Allows requests with valid bearer token", () => {
    adminOnly(mockRequest(`Bearer ${ADMIN_TOKEN}`), res, next);

    assert.equal(next.mock.callCount(), 1);
    assert.equal(next.mock.calls[0]?.arguments.length, 0);
  });
});
