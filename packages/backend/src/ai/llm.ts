import OpenAI from "openai";
import { getRequestContext, logError } from "../utils/telemetry";

const client = new OpenAI();

export async function jsonCompletion<T>(
  action: string,
  prompt: string,
  schema: OpenAI.ResponseFormatJSONSchema.JSONSchema,
  input: string
) {
  try {
    const start = Date.now();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: input },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });
    const duration = Date.now() - start;

    logLLMAction(action, duration, completion);

    const message = extractMessage(completion);

    if (message) {
      return JSON.parse(message) as T;
    }
  } catch (error) {
    logError(error);
  }
}

function extractMessage(completion: OpenAI.ChatCompletion) {
  if (!completion.choices[0]) return;

  const { finish_reason, message } = completion.choices[0] ?? {};

  if (finish_reason === "stop" && message && !message.refusal) {
    return message.content;
  }
}

// #region Telemetry

interface LLMLog {
  action: string;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  ms: number;
  finishReason?: string;
  refusal?: string;
}

interface LLMContext {
  calls: LLMLog[];
  count: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  ms: number;
}

function logLLMAction(
  action: string,
  duration: number,
  { usage, choices }: OpenAI.ChatCompletion
) {
  if (!usage) return;

  const { total_tokens, prompt_tokens, completion_tokens } = usage;
  const { cached_tokens = 0 } = usage.prompt_tokens_details ?? {};
  const { finish_reason, message } = choices[0] ?? {};

  const log: LLMLog = {
    action,
    tokens: total_tokens,
    promptTokens: prompt_tokens,
    completionTokens: completion_tokens,
    cachedTokens: cached_tokens,
    ms: duration,
  };

  if (finish_reason !== "stop") {
    log.finishReason = finish_reason;
  }

  if (message?.refusal) {
    log.refusal = message.refusal;
  }

  addLLMLog(log);
}

function addLLMLog(log: LLMLog) {
  const context = getLLMContext();

  if (context.calls.length < 10) {
    context.calls.push(log);
  }

  context.count++;
  context.tokens += log.tokens;
  context.promptTokens += log.promptTokens;
  context.completionTokens += log.completionTokens;
  context.cachedTokens += log.cachedTokens;
  context.ms += log.ms;
}

function getLLMContext(): LLMContext {
  const context = getRequestContext();
  context.llm ??= <LLMContext>{
    calls: [],
    count: 0,
    tokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    cachedTokens: 0,
    ms: 0,
  };
  return <LLMContext>context.llm;
}

// #endregion
