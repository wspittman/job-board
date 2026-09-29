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

suite("Debounce Utils", () => {
  {
    const task = mock.fn(async () => {});

    beforeEach(() => {
      task.mock.resetCalls();
    });

    test("debounceAsync: executes after delay", async (context) => {
      const tick = mockTimers(context);
      const fn = debounceAsync("test", task, 1000);

      fn();

      assert.equal(task.mock.callCount(), 0);
      await tick(500);
      assert.equal(task.mock.callCount(), 0);
      await tick(510);

      assert.equal(task.mock.callCount(), 1);
    });

    test("debounceAsync: debounces calls within the delay", async (context) => {
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

    test("debounceAsync: allows execution after the debounce completes", async (context) => {
      const tick = mockTimers(context);
      const fn = debounceAsync("test", task, 1000);

      fn();
      await tick(1500);
      fn();
      await tick(1500);

      assert.equal(task.mock.callCount(), 2);
    });
  }

  {
    const task = mock.fn(async () => "result");

    beforeEach(() => {
      task.mock.resetCalls();
    });

    test("debouncePromise: calls the function once for concurrent calls", async () => {
      const db = debouncePromise(task);
      const [r1, r2] = await Promise.all([db(), db()]);

      assert.equal(r1, "result");
      assert.equal(r2, "result");
      assert.equal(task.mock.callCount(), 1);
    });

    test("debouncePromise: returns the same promise for subsequent calls", async () => {
      const db = debouncePromise(task);
      const p1 = db();
      const p2 = db();
      assert.equal(p1, p2);
      await p1;
    });

    test("debouncePromise: clear allows a new call", async () => {
      const db = debouncePromise(task);
      await db();
      assert.equal(task.mock.callCount(), 1);

      db.clear();
      await db();
      assert.equal(task.mock.callCount(), 2);
    });

    test("debouncePromise: rejects current callers and delays new callers during cooldown", async (context) => {
      const tick = mockTimers(context);
      const error = new Error("fail");
      const failingTask = mock.fn(async () => {
        throw error;
      });

      const db = debouncePromise(failingTask);
      const p1 = db();
      const p2 = db();

      assert.equal(p1, p2);
      const firstRejection = assert.rejects(p1, error);
      await tick(0);
      await firstRejection;
      assert.equal(failingTask.mock.callCount(), 1);

      const cooldownP1 = db();
      const cooldownP2 = db();
      let settled = false;
      const observeSettlement = cooldownP1.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        },
      );

      assert.equal(cooldownP1, cooldownP2);
      assert.equal(failingTask.mock.callCount(), 1);
      await tick(9999);
      assert.equal(settled, false);
      assert.equal(failingTask.mock.callCount(), 1);

      const cooldownRejection = assert.rejects(cooldownP1, error);
      await tick(1);
      await cooldownRejection;
      await observeSettlement;
      assert.equal(failingTask.mock.callCount(), 2);
    });

    test("debouncePromise: new callers during cooldown receive the delayed retry promise", async (context) => {
      const tick = mockTimers(context);

      let attempts = 0;
      const taskWithTransientFailure = mock.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("fail");
        }
        return "success";
      });

      const db = debouncePromise(taskWithTransientFailure);
      const firstAttempt = db();
      const firstRejection = assert.rejects(firstAttempt, /fail/);
      await tick(0);
      await firstRejection;

      const retry = db();
      const sameRetry = db();

      assert.equal(retry, sameRetry);
      assert.equal(taskWithTransientFailure.mock.callCount(), 1);

      await tick(9999);
      assert.equal(taskWithTransientFailure.mock.callCount(), 1);

      await tick(1);

      const result = await retry;
      assert.equal(result, "success");
      assert.equal(taskWithTransientFailure.mock.callCount(), 2);
    });

    test("debouncePromise: doubles cooldown after repeated failures", async (context) => {
      const tick = mockTimers(context);
      const failingTask = mock.fn(async () => {
        throw new Error("fail");
      });

      const db = debouncePromise(failingTask);

      const firstAttempt = db();
      const firstRejection = assert.rejects(firstAttempt, /fail/);
      await tick(0);
      await firstRejection;

      const secondAttempt = db();
      const secondRejection = assert.rejects(secondAttempt, /fail/);
      await tick(10000);
      await secondRejection;

      const thirdAttempt = db();
      await tick(19999);
      assert.equal(failingTask.mock.callCount(), 2);

      const thirdRejection = assert.rejects(thirdAttempt, /fail/);
      await tick(1);
      await thirdRejection;
      assert.equal(failingTask.mock.callCount(), 3);
    });

    test("debouncePromise: wraps non-error rejections", async (context) => {
      const tick = mockTimers(context);
      const failingTask = mock.fn(async () => {
        throw "fail";
      });

      const db = debouncePromise(failingTask);
      const attempt = db();
      const rejection = assert.rejects(attempt, {
        message: "fail",
      });

      await tick(0);

      await rejection;
    });
  }
});
