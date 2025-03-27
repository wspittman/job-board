import { withAsyncContext } from "./telemetry.ts";

/**
 * Executes an async function with debouncing behavior.
 * When called multiple times, it will only execute the function once after the specified delay.
 */
export class AsyncExecutor {
  private timeoutId?: NodeJS.Timeout;
  protected name: string;
  protected fn: () => Promise<void>;
  protected delay: number;

  /**
   * Creates a new AsyncExecutor instance.
   * @param name - The name of the executor for context tracking
   * @param fn - The async function to be executed
   * @param delay - The debounce delay in milliseconds (default: 30000ms)
   */
  constructor(name: string, fn: () => Promise<void>, delay = 30000) {
    this.name = name;
    this.fn = fn;
    this.delay = delay;
  }

  /**
   * Triggers the execution of the async function with debouncing.
   * If called multiple times within the delay period, previous calls are canceled.
   */
  call(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      withAsyncContext(this.name, async () => {
        await this.fn();
      });
      this.timeoutId = undefined;
    }, this.delay);
  }
}
