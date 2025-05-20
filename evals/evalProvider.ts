import { readFile, writeFile } from "fs/promises";
import { llm } from "../packages/backend/src/ai/llm.ts";
import type { Company } from "../packages/backend/src/types/dbModels.ts";
import type { Context } from "../packages/backend/src/types/types.ts";

// #region promptfoo partial types

/*
Reluctant to require the promptfoo package as a dev dependency, since we are treating it more as an external tool.
Some simple partial types help us out here
*/

interface ProviderOptions {
  id?: string;
  config?: unknown;
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

  constructor(options: ProviderOptions) {
    this.providerId = options.id || "eval-provider";
    this.config = options.config;
  }

  id(): string {
    return this.providerId;
  }

  async callApi(
    _prompt: string,
    { vars }: CallApiContextParams
  ): Promise<ProviderResponse> {
    const { inputFile } = vars;
    const inputFilePath = `./evals/companyInputs/${inputFile}.json`;
    const fileContent = await readFile(inputFilePath, "utf-8");
    const input = JSON.parse(fileContent) as Context<Company>;

    await llm.fillCompanyInfo(input);

    const ret: ProviderResponse = {
      output: input.item,
    };

    await writeFile(
      // TBD other options go in the file name to differentiate
      `./evals/companyOutputs/${inputFile}_${Date.now()}.json`,
      JSON.stringify(ret, null, 2)
    );

    return ret;
  }
}
