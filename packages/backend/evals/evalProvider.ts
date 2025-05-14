import { proseCompletion } from "dry-utils-openai";

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
    prompt: string,
    { vars }: CallApiContextParams
  ): Promise<ProviderResponse> {
    const { content, error } = await proseCompletion("evalTest", prompt, vars);

    const ret: ProviderResponse = {
      error,
      output: content,
    };
    return ret;
  }
}
