import { specificLLM } from "../packages/backend/src/ai/llm.ts";
import type { Context } from "../packages/backend/src/types/types.ts";
import { startTelemetry } from "../packages/backend/src/utils/telemetry.ts";
import { readInputObj, writeOutputObj } from "./fileUtils.ts";

startTelemetry();

const actions = {
  fillCompany: "fillCompanyInfo",
};

// #region promptfoo partial types

/*
Reluctant to require the promptfoo package as a dev dependency, since we are treating it more as an external tool.
Some simple partial types help us out here
*/

interface ProviderOptions {
  id?: string;
  config?: {
    model?: string;
  };
}

interface CallApiContextParams {
  vars: Record<string, string | object>;
}

interface TokenUsage {
  total: number;
  prompt: number;
  completion: number;
  numRequests: number;
  cached: number;
}

interface ProviderResponse {
  cached?: boolean;
  error?: string;
  output?: string | any;
  tokenUsage?: TokenUsage;
}

// #endregion

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
    const input = await readInputObj<T>(action, file);

    await specificLLM(this.model)[actions[action]](input);

    const ret: ProviderResponse = {
      output: input.item,
    };

    await writeOutputObj(action, file, ret);

    return ret;
  }
}
