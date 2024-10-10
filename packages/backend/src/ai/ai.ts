import OpenAI from "openai";
import { LRUCache } from "../utils/cache";

const client = new OpenAI();
const locationCache = new LRUCache<string, any>(1000);

const locationPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or hybrid/on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or hybrid/on-site.
Provide the response JSON, using empty string ("") for any unknown fields.`;

const locationSchema = {
  name: "location_schema",
  schema: {
    type: "object",
    properties: {
      remote: {
        type: "boolean",
        description: "true for full remote jobs",
      },
      city: { type: "string", description: "city name" },
      state: {
        type: "string",
        description: "state, province, or similar name",
      },
      stateAcronym: {
        type: "string",
        description: "Well-known acronym for the `state` field, if one exists",
      },
      country: { type: "string", description: "country name" },
      countryAcronym: {
        type: "string",
        description:
          "Well-known acronym for the `country` field, if one exists",
      },
    },
    additionalProperties: false,
  },
};

export async function extractLocation(locationText: string) {
  const normalizedText = locationText.toLowerCase().trim();
  const cachedResult = locationCache.get(normalizedText);

  if (cachedResult) {
    console.debug(`AI.extractLocation: Cache hit for ${normalizedText}`);
    return cachedResult;
  }

  const result = await jsonCompletion(
    locationPrompt,
    locationSchema,
    locationText
  );

  if (result) {
    locationCache.set(normalizedText, result);
    return result;
  }

  return undefined;
}

async function jsonCompletion(
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

    return extractMessage(prefix, completion);
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
