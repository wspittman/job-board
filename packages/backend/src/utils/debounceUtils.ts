import { clearTimeout, setTimeout } from "node:timers";
import { withAsyncContext } from "./telemetry.ts";

export function debounceAsync(
  name: string,
  fn: () => Promise<void>,
  delay = 30_000,
): () => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return function debouncedFn() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
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
        setTimeout(() => wrapFn(resolve), errRetry * 60 * 1000);
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
