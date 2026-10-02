import { TestContext } from "node:test";
import timers from "node:timers/promises";

/**
 * Mocks timers for testing
 * @param context The test context
 * @returns A function to tick the mocked timers
 */
export function mockTimers(context: TestContext) {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  return async (ms: number) => {
    // Advance the mocked timers by the given number of milliseconds
    context.mock.timers.tick(ms);
    // Force the event loop to run all pending callbacks
    await timers.setImmediate();
  };
}
