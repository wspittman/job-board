import assert from "node:assert/strict";
import { beforeEach, mock, suite, test } from "node:test";
import timers from "node:timers/promises";
import { debounceAsync } from "../../src/utils/debounceUtils.ts";

suite("debounceAsync", () => {
  const task = mock.fn(async () => {});

  beforeEach(() => {
    task.mock.resetCalls();
  });

  test("executes after delay", async () => {
    const executor = debounceAsync("executor", task, 10);

    executor();

    assert.equal(task.mock.callCount(), 0);
    await timers.setTimeout(5);
    assert.equal(task.mock.callCount(), 0);
    await timers.setTimeout(10);

    assert.equal(task.mock.callCount(), 1);
  });

  test("debounces calls within the delay", async () => {
    const executor = debounceAsync("executor", task, 10);

    executor();
    await timers.setTimeout(5);
    executor();
    await timers.setTimeout(5);

    assert.equal(task.mock.callCount(), 0);

    await timers.setTimeout(10);

    assert.equal(task.mock.callCount(), 1);
  });

  test("allows execution after the debounce completes", async () => {
    const executor = debounceAsync("executor", task, 10);

    executor();
    await timers.setTimeout(15);
    executor();
    await timers.setTimeout(15);

    assert.equal(task.mock.callCount(), 2);
  });
});
