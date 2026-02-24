import assert from "node:assert/strict";
import { beforeEach, mock, suite, test, TestContext } from "node:test";
import timers from "node:timers/promises";
import {
  debounceAsync,
  debouncePromise,
} from "../../src/utils/debounceUtils.ts";

/**
 * Mocks timers for testing
 * @param context - The test context
 * @returns A function to tick the mocked timers
 */
function mockTimers(context: TestContext) {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  return async (ms: number) => {
    context.mock.timers.tick(ms);
    await timers.setImmediate();
  };
}

suite("debounceAsync", () => {
  const task = mock.fn(async () => {});

  beforeEach(() => {
    task.mock.resetCalls();
  });

  test("executes after delay", async (context) => {
    const tick = mockTimers(context);
    const fn = debounceAsync("test", task, 1000);

    fn();

    assert.equal(task.mock.callCount(), 0);
    await tick(500);
    assert.equal(task.mock.callCount(), 0);
    await tick(510);

    assert.equal(task.mock.callCount(), 1);
  });

  test("debounces calls within the delay", async (context) => {
    const tick = mockTimers(context);
    const fn = debounceAsync("test", task, 1000);

    fn();
    await tick(500);
    fn();
    await tick(500);

    assert.equal(task.mock.callCount(), 0);

    await tick(510);

    assert.equal(task.mock.callCount(), 1);
  });

  test("allows execution after the debounce completes", async (context) => {
    const tick = mockTimers(context);
    const fn = debounceAsync("test", task, 1000);

    fn();
    await tick(1500);
    fn();
    await tick(1500);

    assert.equal(task.mock.callCount(), 2);
  });
});

suite("debouncePromise", () => {
  const task = mock.fn(async () => "result");

  beforeEach(() => {
    task.mock.resetCalls();
  });

  test("calls the function once for concurrent calls", async () => {
    const db = debouncePromise(task);
    const [r1, r2] = await Promise.all([db(), db()]);

    assert.equal(r1, "result");
    assert.equal(r2, "result");
    assert.equal(task.mock.callCount(), 1);
  });

  test("returns the same promise for subsequent calls", async () => {
    const db = debouncePromise(task);
    const p1 = db();
    const p2 = db();
    assert.equal(p1, p2);
    await p1;
  });

  test("clear allows a new call", async () => {
    const db = debouncePromise(task);
    await db();
    assert.equal(task.mock.callCount(), 1);

    db.clear();
    await db();
    assert.equal(task.mock.callCount(), 2);
  });

  test("retries on failure", async (context) => {
    const tick = mockTimers(context);

    let fail = true;
    const failingTask = mock.fn(async () => {
      if (fail) {
        fail = false;
        throw new Error("fail");
      }
      return "success";
    });

    const db = debouncePromise(failingTask);
    const p = db();

    await tick(5);

    assert.equal(failingTask.mock.callCount(), 1);

    await tick(60000);

    const result = await p;
    assert.equal(result, "success");
    assert.equal(failingTask.mock.callCount(), 2);
  });

  test("exponential backoff on multiple failures", async (context) => {
    const tick = mockTimers(context);

    let attempts = 0;
    const failingTask = mock.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("fail");
      }
      return "success";
    });

    const db = debouncePromise(failingTask);
    const p = db();

    // 1st attempt fails
    await tick(5);
    assert.equal(failingTask.mock.callCount(), 1);

    // 1st retry: 1 min
    await tick(60000);
    assert.equal(failingTask.mock.callCount(), 2);

    // 2nd attempt fails
    // 2nd retry: 2 mins
    await tick(120000);
    assert.equal(failingTask.mock.callCount(), 3);

    const result = await p;
    assert.equal(result, "success");
  });
});
