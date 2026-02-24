import { clearTimeout, setTimeout } from "node:timers";
import { withAsyncContext } from "./telemetry.ts";

type VoidFn = () => void;
type AsyncFn = () => Promise<void>;

export function debounceAsync(
  name: string,
  fn: AsyncFn,
  delay = 30_000,
): VoidFn {
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
