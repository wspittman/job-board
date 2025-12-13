import type { Request, Response } from "express";
import assert from "node:assert/strict";
import { beforeEach, mock, suite, test } from "node:test";
import { jsonRoute } from "../../src/middleware/wrappers.ts";

type Method = "GET" | "PUT";

interface In {
  in: string;
  fail?: boolean;
}

interface Out {
  result: string;
}

// #region Function Inputs

function mockRequest(method: Method, input: In): Request {
  return {
    method,
    ...(method === "GET" ? { query: input } : { body: input }),
  } as Request;
}

const route = (input: In) => {
  return input.fail
    ? Promise.reject(new Error("Failed"))
    : Promise.resolve(`${input.in}_R`);
};
const routeVoid = async (input: In) => {
  await route(input);
};
const routeStr = async (input: In) => await route(input);
const routeObj = async (input: In) => ({ result: await route(input) });
type Route = typeof routeVoid | typeof routeStr | typeof routeObj;

function validator(input: unknown): In {
  if (input && typeof input === "object" && "in" in input) {
    return { ...input, in: `${input.in}_V` };
  }
  throw new Error("Invalid");
}

function formatter(output: Out | string | void): Out {
  const str = output && typeof output === "object" ? output.result : output;
  return { result: `${str ?? ""}_F` };
}

// #endregion

suite("jsonRoute", () => {
  const jsonFn = mock.fn(() => res);
  const res: Response = { json: jsonFn } as unknown as Response;
  const next = mock.fn();

  beforeEach(() => {
    jsonFn.mock.resetCalls();
    next.mock.resetCalls();
  });

  const successCases: [Route, Method, boolean?, boolean?][] = [
    [routeVoid, "GET"],
    [routeVoid, "PUT"],
    [routeVoid, "PUT", true],
    [routeVoid, "PUT", true, true],
    [routeStr, "GET"],
    [routeStr, "PUT"],
    [routeStr, "PUT", true],
    [routeStr, "PUT", true, true],
    [routeObj, "GET"],
    [routeObj, "PUT"],
    [routeObj, "PUT", true],
    [routeObj, "PUT", true, true],
  ];

  successCases.forEach(([fn, method, omitV, omitF]) => {
    test(`Valid: ${method} ${fn.name} V:${!omitV} F:${!omitF}`, async () => {
      const req = mockRequest(method, { in: "mark" });
      const handler = jsonRoute(
        fn,
        omitV ? undefined : validator,
        omitF ? undefined : formatter,
      );

      await handler(req, res, next);

      assert.equal(jsonFn.mock.callCount(), 1);
      assert.equal(next.mock.callCount(), 0);

      const expectedResult = [
        "mark",
        !omitV ? "_V" : "",
        "_R",
        !omitF ? "_F" : "",
      ].join("");

      let expectedOutput: unknown = { result: expectedResult };

      if (fn === routeVoid) {
        expectedOutput = omitF ? { status: "success" } : { result: "_F" };
      } else if (fn === routeStr && omitF) {
        expectedOutput = expectedResult;
      }

      assert.deepEqual(jsonFn.mock.calls[0]?.arguments.at(0), expectedOutput);
    });
  });

  test("Invalid: Validator error", async () => {
    const req = mockRequest("PUT", {} as In);
    const handler = jsonRoute(routeStr, validator, formatter);

    await handler(req, res, next);

    assert.equal(jsonFn.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 1);

    const err = next.mock.calls[0]?.arguments.at(0);
    assert.ok(err instanceof Error);
    assert.equal(err.message, "Invalid");
  });

  test("Invalid: Route error", async () => {
    const req = mockRequest("PUT", { in: "data", fail: true });
    const handler = jsonRoute(routeStr, validator, formatter);

    await handler(req, res, next);

    assert.equal(jsonFn.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 1);

    const err = next.mock.calls[0]?.arguments.at(0);
    assert.ok(err instanceof Error);
    assert.equal(err.message, "Failed");
  });
});
