import assert from "node:assert/strict";
import { mock, suite, test } from "node:test";
import timers from "node:timers/promises";
import { AsyncQueue } from "../../src/utils/asyncQueue.ts";

const waitFor = async (
  predicate: () => boolean,
  timeoutMs: number = 200,
): Promise<void> => {
  const start = Date.now();

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await timers.setTimeout(5);
  }
};

suite("AsyncQueue", () => {
  test("processes tasks in FIFO order with a concurrency cap", async () => {
    const started: number[] = [];
    const finished: number[] = [];
    let active = 0;
    let maxActive = 0;

    const queue = new AsyncQueue<number>(
      "test",
      async (task) => {
        started.push(task);
        active += 1;
        maxActive = Math.max(maxActive, active);
        await timers.setTimeout(5);
        finished.push(task);
        active -= 1;
      },
      { concurrentLimit: 2 },
    );

    queue.add([1, 2, 3, 4]);

    await waitFor(() => finished.length === 4, 500);

    assert.deepEqual(started, [1, 2, 3, 4]);
    assert.ok(maxActive <= 2);
  });

  test("invokes onComplete for each task", async () => {
    const onComplete = { call: mock.fn() };

    const queue = new AsyncQueue<number>(
      "test",
      async () => {
        await timers.setTimeout(2);
      },
      { onComplete: onComplete as unknown as { call: () => void } },
    );

    queue.add([10, 20, 30]);

    await waitFor(() => onComplete.call.mock.callCount() === 3, 500);

    assert.equal(onComplete.call.mock.callCount(), 3);
  });

  test("continues processing after a task throws", async () => {
    const started: number[] = [];
    const queue = new AsyncQueue<{ id: number; shouldThrow: boolean }>(
      "test",
      async (task) => {
        started.push(task.id);
        if (task.shouldThrow) {
          throw new Error("Boom");
        }
      },
    );

    queue.add([
      { id: 1, shouldThrow: true },
      { id: 2, shouldThrow: false },
    ]);

    await waitFor(() => started.length === 2, 500);

    assert.deepEqual(started, [1, 2]);
  });
});
