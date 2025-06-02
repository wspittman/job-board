import { createHash } from "crypto";
import { setAILogging } from "dry-utils-openai";
import type { Context, Log, Scenario } from "./types";

class TelemetryCatcher {
  private logs: Record<string, Log> = {};

  constructor() {}

  createMarkedInput<T>({ action, model, source }: Scenario<T>): Context<T> {
    const { name, input } = source;

    return {
      ...input,
      item: {
        // Add a simple hash to differentiate parallel requests
        // This DOES effect what is sent to the LLM, but should be opaque.
        v: this.hash(action, model.name, name),
        ...input.item,
      },
    };
  }

  catch(log: Log): void {
    const key = log.in.slice(6, 38);
    this.logs[key] = log;
  }

  find<T>(context: Context<T>): Log | undefined {
    return this.logs[context.item["v"]];
  }

  private hash(...args: string[]): string {
    return createHash("sha256")
      .update(args.join(""))
      .digest("hex")
      .slice(0, 32);
  }
}

export const catcher = new TelemetryCatcher();

setAILogging({
  errorFn: (msg, val) => console.error(new Error(msg, { cause: val })),
  aggregatorFn: () => ({ count: 0, counts: {} }),
  logCallFn: (_, log) => catcher.catch(log as Log),
});
