import type { Request, Response } from "express";
import assert from "node:assert/strict";
import { beforeEach, mock, suite, test } from "node:test";
import { logIdentifiers } from "../../src/middleware/logIdentifiers.ts";
import { Bag } from "../../src/types/types.ts";
import telemetryWorkaround from "../../src/utils/telemetryWorkaround.cjs";

const headers = {
  "jb-visitor-id": "d4e08dd6-9d72-4c39-a9c2-7c4895a2c072",
  "jb-session-id": "aac57f52-07df-47af-a8ed-7e64e4f2c92c",
};
const query = {
  visitorId: "5cd22f19-f301-4207-85b4-7b91b701f31b",
  sessionId: "2a6716db-5a52-4860-9f6b-6bc07d99bda2",
};
const expectHeaders = {
  visitorId: headers["jb-visitor-id"],
  sessionId: headers["jb-session-id"],
};

interface CaseInput {
  method: "GET" | "POST";
  path: string;
  headers: Bag;
  query: Bag;
  expected: Bag;
}

const caseDefaults: CaseInput = {
  method: "GET",
  path: "/api/job/apply",
  headers,
  query,
  expected: expectHeaders,
};

suite("logIdentifiers", () => {
  const res = {} as Response;
  const next = mock.fn();
  let correlationContext: Bag = {};

  mock.method(
    telemetryWorkaround,
    "getCorrelationContext",
    () => correlationContext,
  );

  beforeEach(() => {
    next.mock.resetCalls();
    correlationContext = {};
  });

  const cases: Partial<CaseInput>[] = [
    {
      path: "/api/jobs",
    },
    {
      headers: {},
      expected: query,
    },
    {},
    {
      method: "POST",
      headers: {},
      expected: {},
    },
  ];

  cases.forEach((caseInput) => {
    const testInput = { ...caseDefaults, ...caseInput };

    test(`passes identifiers for ${testInput.method} ${testInput.path}`, () => {
      const req = testInput as unknown as Request;

      logIdentifiers(req, res, next);

      assert.equal(next.mock.callCount(), 1);
      const actual = (correlationContext.requestContext as Bag)?.prop ?? {};
      assert.deepStrictEqual(actual, testInput.expected);
    });
  });

  test("logs error but continues when beacon validation fails", () => {
    const req = {
      ...caseDefaults,
      headers: {
        "jb-visitor-id": "invalid",
        "jb-session-id": "invalid",
      },
    } as unknown as Request;

    assert.doesNotThrow(() => logIdentifiers(req, res, next));

    assert.equal(next.mock.callCount(), 1);
    const actual = (correlationContext.requestContext as Bag)?.prop ?? {};
    assert.deepStrictEqual(actual, {});
  });
});
