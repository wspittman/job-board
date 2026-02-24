import timers from "node:timers";
import { withAsyncContext } from "./telemetry.ts";

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
 * explicitly cleared. If the operation fails, it automatically retries with 
 * exponential backoff.
 *
 * @param fn - The asynchronous function that resolves with the data.
 * @returns A function that resolves with the data, including a `clear()` method to reset.
 */
export function debouncePromise<T>(fn: () => Promise<T>): DBPromise<T> {
  let promise: Promise<T> | undefined = undefined;
  let errRetry = 1;

  const wrapFn = (resolve: (value: T) => void) => {
    fn()
      .then((result) => {
        errRetry = 1;
        resolve(result);
      })
      .catch(() => {
        timers.setTimeout(() => wrapFn(resolve), errRetry * 60 * 1000);
        errRetry *= 2;
      });
  };

  const dbFn = function debouncedFn() {
    if (!promise) {
      promise = new Promise(wrapFn);
    }

    return promise;
  };

  dbFn.clear = () => {
    promise = undefined;
    errRetry = 1;
  };

  return dbFn;
}
