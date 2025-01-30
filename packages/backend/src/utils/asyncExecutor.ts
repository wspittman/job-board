import { withAsyncContext } from "./telemetry";

export class AsyncExecutor {
  private timeoutId?: NodeJS.Timeout;

  constructor(
    protected name: string,
    protected fn: () => Promise<void>,
    protected delay: number = 30000
  ) {}

  call() {
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
