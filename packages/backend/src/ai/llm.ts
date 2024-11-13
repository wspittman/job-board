import OpenAI from "openai";

const client = new OpenAI();

export async function jsonCompletion<T>(
  prompt: string,
  schema: OpenAI.ResponseFormatJSONSchema.JSONSchema,
  input: string
) {
  const prefix = "AI.jsonCompletion";

  try {
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

    logTokens(prefix, completion);

    const message = extractMessage(prefix, completion);

    if (message) {
      return JSON.parse(message) as T;
    }
  } catch (error) {
    console.error(`${prefix}: Error ${error}`);
  }
}

function extractMessage(prefix: string, completion: OpenAI.ChatCompletion) {
  if (!completion.choices[0]) return;

  const { finish_reason, message } = completion.choices[0] ?? {};

  if (finish_reason === "stop" && message && !message.refusal) {
    return message.content;
  }

  console.error(`${prefix}: Refusal = ${finish_reason} / ${message?.refusal}`);
}

function logTokens(prefix: string, completion?: OpenAI.ChatCompletion) {
  if (!completion?.usage) return;

  const { completion_tokens, prompt_tokens, total_tokens } = completion.usage;
  const { cached_tokens } = completion.usage.prompt_tokens_details ?? {};

  console.debug(
    `${prefix}: ${total_tokens} tokens = ${prompt_tokens} prompt (${cached_tokens} cached) + ${completion_tokens} completion)`
  );
}
