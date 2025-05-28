// #region promptfoo partial types

/*
Reluctant to require the promptfoo package as a dev dependency, since we are treating it more as an external tool.
Some simple partial types help us out here
*/

type VARS = Record<string, string | object>;

interface ProviderOptions {
  id?: string;
  config?: {
    model?: string;
  };
}

interface CallApiContextParams {
  vars: VARS;
}

interface TokenUsage {
  total: number;
  prompt: number;
  completion: number;
  numRequests?: number;
  cached?: number;
  duration?: number; // Added
}

interface ProviderResponse {
  cached?: boolean;
  error?: string;
  output?: string | any;
  tokenUsage?: TokenUsage;
}

type AssertionValueFunctionContext = {
  prompt: string;
  vars: VARS;
};
type AssertContext = AssertionValueFunctionContext;

// #endregion
