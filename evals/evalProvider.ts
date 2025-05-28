import { createHash } from "crypto";
import { setAILogging } from "dry-utils-openai";
import { specificLLM } from "../packages/backend/src/ai/llm.ts";
import type { Context } from "../packages/backend/src/types/types.ts";
import { readObj, writeObj } from "./fileUtils.ts";

const actions = {
  fillCompany: "fillCompanyInfo",
};

export default class EvalProvider {
  protected providerId: string;
  public config: unknown;
  private provider: string;
  private model: string;

  constructor(options: ProviderOptions) {
    this.providerId = options.id || "eval-provider";
    this.config = options.config;
    [this.provider, this.model] = options.config?.model?.split(":") ?? [];
  }

  id(): string {
    return this.providerId;
  }

  async callApi(
    prompt: string,
    { vars }: CallApiContextParams
  ): Promise<ProviderResponse> {
    const { inputFile } = vars;

    if (typeof inputFile !== "string" || !inputFile) {
      throw new Error("Missing input file");
    }

    if (!actions[prompt]) {
      throw new Error(`Unknown action: ${prompt}`);
    }

    return await this.runAction(prompt, inputFile);
  }

  private async runAction<T extends Context<object>>(
    action: string,
    file: string
  ) {
    const outputFile = `${this.model}_${file}`;
    const savedOutput = await readObj<ProviderResponse>(
      action,
      "Outputs",
      outputFile
    );

    if (savedOutput) {
      return savedOutput;
    }

    const input = await readObj<T>(action, "Inputs", file);
    if (!input) {
      throw new Error(`Input file not found: ${file}`);
    }

    input.item = catcher.mark(input.item, action, this.model, file);

    await specificLLM(this.model)[actions[action]](input);

    const log = catcher.find(input.item);

    const ret: ProviderResponse = {
      output: input.item,
      tokenUsage: {
        total: log["tokens"] as number,
        prompt: log["inTokens"] as number,
        completion: log["outTokens"] as number,
        duration: log["ms"] as number,
      },
    };

    await writeObj(action, "Outputs", outputFile, ret);

    return ret;
  }
}

// #region Telemetry Catcher

class TelemetryCatcher {
  private logs: Record<string, object> = {};

  constructor() {}

  mark<T>(item: T, ...args: string[]): T {
    return {
      // Add a simple hash to differentiate parallel requests
      // This DOES effect what is sent to the LLM, but should be opaque.
      v: this.hash(...args),
      ...item,
    };
  }

  catch(log: Record<string, unknown>): void {
    const input = log["in"] as string;
    const key = input.slice(6, 38);
    this.logs[key] = log;
  }

  find(obj: object): object {
    return this.logs[obj["v"]];
  }

  private hash(...args: string[]): string {
    return createHash("sha256")
      .update(args.join(""))
      .digest("hex")
      .slice(0, 32);
  }
}

const catcher = new TelemetryCatcher();

setAILogging({
  errorFn: (msg, val) => console.error(new Error(msg, { cause: val })),
  aggregatorFn: () => ({ count: 0, counts: {} }),
  logCallFn: (_, log) => catcher.catch(log as Record<string, unknown>),
});

// #endregion
