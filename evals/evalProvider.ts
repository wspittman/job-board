import { specificLLM } from "../packages/backend/src/ai/llm.ts";
import type { Context } from "../packages/backend/src/types/types.ts";
import { startTelemetry } from "../packages/backend/src/utils/telemetry.ts";
import { readObj, writeObj } from "./fileUtils.ts";

startTelemetry();

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

    await specificLLM(this.model)[actions[action]](input);

    const ret: ProviderResponse = {
      output: input.item,
    };

    await writeObj(action, "Outputs", outputFile, ret);

    return ret;
  }
}
