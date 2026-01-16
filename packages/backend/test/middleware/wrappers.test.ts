import type { Request, Response } from "express";
import assert from "node:assert/strict";
import { beforeEach, mock, suite, test, TestContext } from "node:test";
// Note: Destructuring functions such as import { setTimeout } from 'node:timers' is currently not supported by [Mock Timers] API.
import timers from "node:timers/promises";
import {
  asyncRoute,
  beaconRoute,
  jsonRoute,
  redirectRoute,
} from "../../src/middleware/wrappers.ts";

type Method = "GET" | "PUT";

interface In {
  in: string;
  fail?: boolean;
}

interface Out {
  result: string;
}

/**
 * Mocks timers for testing
 * @param context - The test context
 * @returns A function to tick the mocked timers
 */
function mockTimers(context: TestContext) {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  return async (ms: number) => {
    // Advance the mocked timers by the given number of milliseconds
    context.mock.timers.tick(ms);
    // Force the event loop to run all pending callbacks
    await timers.setImmediate();
  };
}

// #region Function Inputs

const IN_DATA = "INPUT_DATA";
const IN_BASIC: In = { in: IN_DATA };
const IN_FAIL: In = { ...IN_BASIC, fail: true };
const IN_BAD = {} as In;

function mockRequest(method: Method, input: In): Request {
  return {
    method,
    path: "/test/path",
    ...(method === "GET" ? { query: input } : { body: input }),
  } as Request;
}

const route = (input: In) => {
  return input.fail
    ? Promise.reject(new Error("Route Throws"))
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
  throw new Error("Validator Throws");
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
      const req = mockRequest(method, IN_BASIC);
      const handler = jsonRoute(
        fn,
        omitV ? undefined : validator,
        omitF ? undefined : formatter,
      );

      await handler(req, res, next);

      assert.equal(jsonFn.mock.callCount(), 1);
      assert.equal(next.mock.callCount(), 0);

      const expectedResult = [
        IN_DATA,
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

  const failCases: [Request, string][] = [
    [mockRequest("GET", IN_BAD), "Validator Throws"],
    [mockRequest("PUT", IN_BAD), "Validator Throws"],
    [mockRequest("PUT", IN_FAIL), "Route Throws"],
  ];

  failCases.forEach(([req, errMsg]) => {
    test(`Invalid: ${req.method} expected error "${errMsg}"`, async () => {
      const handler = jsonRoute(routeStr, validator, formatter);

      await handler(req, res, next);

      assert.equal(jsonFn.mock.callCount(), 0);
      assert.equal(next.mock.callCount(), 1);

      const err = next.mock.calls[0]?.arguments.at(0);
      assert.ok(err instanceof Error);
      assert.equal(err.message, errMsg);
    });
  });
});

suite("asyncRoute", () => {
  const writeHeadFn = mock.fn();
  const endFn = mock.fn();
  const res: Response = {
    writeHead: writeHeadFn,
    end: endFn,
    get headersSent() {
      return endFn.mock.callCount() > 0;
    },
  } as unknown as Response;
  const asyncComplete = mock.fn();
  const routeAsync = mock.fn(async (input: In) => {
    await timers.setTimeout(1000);
    await routeVoid(input);
    asyncComplete();
  });
  const next = mock.fn();

  beforeEach(() => {
    writeHeadFn.mock.resetCalls();
    endFn.mock.resetCalls();
    routeAsync.mock.resetCalls();
    asyncComplete.mock.resetCalls();
    next.mock.resetCalls();
  });

  function validateCalls(type: "start" | "end" | "next") {
    const started = type === "start" || type === "end";
    assert.equal(writeHeadFn.mock.callCount(), started ? 1 : 0);
    assert.equal(endFn.mock.callCount(), started ? 1 : 0);
    assert.equal(routeAsync.mock.callCount(), started ? 1 : 0);
    assert.equal(asyncComplete.mock.callCount(), type === "end" ? 1 : 0);
    assert.equal(next.mock.callCount(), type === "next" ? 1 : 0);
  }

  test("Valid and asynchronous", async (context) => {
    const tick = mockTimers(context);
    const req = mockRequest("PUT", IN_BASIC);
    // Note: We don't need to test validator cases here again since they are covered in jsonRoute tests
    const handler = asyncRoute(routeAsync, validator);

    handler(req, res, next);

    validateCalls("start");
    await tick(1000);
    validateCalls("end");
  });

  test("Invalid: Validator Throws", async () => {
    const req = mockRequest("PUT", IN_BAD);
    const handler = asyncRoute(routeAsync, validator);

    handler(req, res, next);

    validateCalls("next");
    const err = next.mock.calls[0]?.arguments.at(0);
    assert.ok(err instanceof Error);
    assert.equal(err.message, "Validator Throws");
  });

  test("Invalid: Route Throws", async (context) => {
    const tick = mockTimers(context);
    const req = mockRequest("PUT", IN_FAIL);
    const handler = asyncRoute(routeAsync, validator);

    handler(req, res, next);

    validateCalls("start");
    await tick(1000);
    validateCalls("start");
    // We aren't bothering to mock and check logError calls here
  });
});

suite("redirectRoute", () => {
  const redirectFn = mock.fn();
  const res: Response = { redirect: redirectFn } as unknown as Response;
  const next = mock.fn();

  beforeEach(() => {
    redirectFn.mock.resetCalls();
    next.mock.resetCalls();
  });

  test(`Valid with redirect`, async () => {
    const req = mockRequest("PUT", IN_BASIC);
    // Note: We don't need to test validator cases here again since they are covered in jsonRoute tests
    const handler = redirectRoute(routeStr, validator);

    await handler(req, res, next);

    assert.equal(redirectFn.mock.callCount(), 1);
    assert.equal(next.mock.callCount(), 0);

    const expectedUrl = `${IN_DATA}_V_R`;
    const redirectArgs = redirectFn.mock.calls[0]?.arguments;
    assert.equal(redirectArgs?.at(0), 302);
    assert.equal(redirectArgs?.at(1), expectedUrl);
  });

  const failCases: [Request, string][] = [
    [mockRequest("GET", IN_BAD), "Validator Throws"],
    [mockRequest("PUT", IN_BAD), "Validator Throws"],
    [mockRequest("PUT", IN_FAIL), "Route Throws"],
  ];

  failCases.forEach(([req, errMsg]) => {
    test(`Invalid: ${req.method} expected error "${errMsg}"`, async () => {
      const handler = redirectRoute(routeStr, validator);

      await handler(req, res, next);

      assert.equal(redirectFn.mock.callCount(), 0);
      assert.equal(next.mock.callCount(), 1);

      const err = next.mock.calls[0]?.arguments.at(0);
      assert.ok(err instanceof Error);
      assert.equal(err.message, errMsg);
    });
  });
});

suite("beaconRoute", () => {
  const writeHeadFn = mock.fn();
  const endFn = mock.fn();
  const res: Response = {
    writeHead: writeHeadFn,
    end: endFn,
  } as unknown as Response;
  const next = mock.fn();

  beforeEach(() => {
    writeHeadFn.mock.resetCalls();
    endFn.mock.resetCalls();
    next.mock.resetCalls();
  });

  test("Valid beacon payload", () => {
    const validatorFn = mock.fn();
    const handler = beaconRoute(validatorFn);
    const payload = { event: "beacon", value: 42 };
    const req = { body: JSON.stringify(payload) } as Request;

    handler(req, res, next);

    assert.equal(validatorFn.mock.callCount(), 1);
    assert.deepEqual(validatorFn.mock.calls[0]?.arguments.at(0), payload);
    assert.equal(writeHeadFn.mock.callCount(), 1);
    assert.equal(writeHeadFn.mock.calls[0]?.arguments.at(0), 204);
    assert.equal(endFn.mock.callCount(), 1);
    assert.equal(next.mock.callCount(), 0);
  });

  test("Invalid JSON payload", () => {
    const validatorFn = mock.fn();
    const handler = beaconRoute(validatorFn);
    const req = { body: "{bad-json" } as Request;

    handler(req, res, next);

    assert.equal(validatorFn.mock.callCount(), 0);
    assert.equal(writeHeadFn.mock.callCount(), 0);
    assert.equal(endFn.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 1);
    const err = next.mock.calls[0]?.arguments.at(0);
    assert.ok(err instanceof Error);
  });

  test("Validator throws", () => {
    const validatorFn = mock.fn(() => {
      throw new Error("Beacon validator failed");
    });
    const handler = beaconRoute(validatorFn);
    const req = { body: JSON.stringify({ ok: false }) } as Request;

    handler(req, res, next);

    assert.equal(validatorFn.mock.callCount(), 1);
    assert.equal(writeHeadFn.mock.callCount(), 0);
    assert.equal(endFn.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 1);
    const err = next.mock.calls[0]?.arguments.at(0);
    assert.ok(err instanceof Error);
    assert.equal(err.message, "Beacon validator failed");
  });
});
