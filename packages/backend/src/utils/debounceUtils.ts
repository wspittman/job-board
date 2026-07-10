import timers from "node:timers";
import { withAsyncContext } from "../telemetry/telemetry.ts";

/**
 * Creates a debounced function that delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked. The execution
 * is wrapped in an asynchronous context for telemetry.
 *
 * @param name - The name used for telemetry context.
 * @param fn - The asynchronous function to debounce.
 * @param delay - The number of milliseconds to delay. Defaults to 30,000 (30s).
 * @returns The new debounced function.
 */
export function debounceAsync(
  name: string,
  fn: () => Promise<void>,
  delay = 30_000,
): () => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return function debouncedFn() {
    if (timeoutId) {
      timers.clearTimeout(timeoutId);
    }

    timeoutId = timers.setTimeout(() => {
      void withAsyncContext(name, async () => {
        await fn();
      });
    }, delay);
  };
}

type DBPromise<T> = {
  (): Promise<T>;
  clear(): void;
};

/**
 * Creates a function that caches and returns the result of an asynchronous operation.
 * Subsequent calls return the same promise until it resolves successfully or is
 * explicitly cleared. If the operation fails, current callers receive the error
 * and new attempts are throttled with an exponential cooldown.
 *
 * @param fn The asynchronous function that resolves with the data.
 * @returns A function that resolves with the data, including a `clear()` method to reset.
 */
export function debouncePromise<T>(fn: () => Promise<T>): DBPromise<T> {
  const cooldownMS = 10 * 1000;
  let promise: Promise<T> | undefined = undefined;
  let cooldown = 0;

  const wrapFn = () =>
    new Promise<T>((resolve, reject) => {
      timers.setTimeout(() => {
        fn()
          .then((result) => {
            cooldown = 0;
            resolve(result);
          })
          .catch((err: unknown) => {
            promise = undefined;
            cooldown = Math.max(1, 2 * cooldown);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      }, cooldownMS * cooldown);
    });

  const dbFn = function debouncedFn() {
    if (!promise) {
      promise = wrapFn();
    }

    return promise;
  };

  dbFn.clear = () => {
    promise = undefined;
  };

  return dbFn;
}
