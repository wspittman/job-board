import OpenAI from "openai";
import type { Job } from "../db/models";
import { batchRun } from "../utils/async";
import { LRUCache } from "../utils/cache";

const client = new OpenAI();
const locationCache = new LRUCache<string, Location>(1000);

const locationPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or hybrid/on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or hybrid/on-site.
Provide the response JSON, using empty string ("") for any unknown fields.`;

type Location = Pick<Job, "isRemote" | "location"> | undefined;

interface LocationSchema {
  remote: boolean;
  city: string;
  state: string;
  stateAcronym: string;
  country: string;
  countryAcronym: string;
}

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

export async function extractLocations(texts: string[]): Promise<Location[]> {
  // All original texts -> normalized text
  const normalizeMap = new Map<string, string>();
  // All normalized texts -> an example of original text
  const normalizeExampleMap = new Map<string, string>();
  // All normalized texts -> extracted location object
  const extractMap = new Map<string, Location>();

  // Create the normalization maps
  texts.forEach((text) => {
    const normalizedText = text.toLowerCase().trim();
    normalizeMap.set(text, normalizedText);
    normalizeExampleMap.set(normalizedText, text);
  });

  const normalizedTexts = Array.from(normalizeExampleMap.keys());

  // For each normalization text, extract the location using an example of original text
  await batchRun(normalizedTexts, async (normalizedText) => {
    const result = await extractLocation(
      normalizeExampleMap.get(normalizedText)!
    );
    extractMap.set(normalizedText, result);
  });

  // Return the extracted location objects in the order of the original texts
  return texts.map((text) => extractMap.get(normalizeMap.get(text)!));
}

export async function extractLocation(text: string): Promise<Location> {
  const normalizedText = text.toLowerCase().trim();
  const cachedResult = locationCache.get(normalizedText);

  if (cachedResult) {
    console.debug(`AI.extractLocation: Cache hit for [${text}]`);
    return cachedResult;
  }

  const result = await jsonCompletion<LocationSchema>(
    locationPrompt,
    locationSchema,
    text
  );

  if (result) {
    const locationResult = {
      isRemote: result.remote,
      location: formatLocation(result),
    };
    console.debug(`AI.extractLocation: "${text}"`, locationResult);

    locationCache.set(normalizedText, locationResult);
    return locationResult;
  }

  console.debug(`AI.extractLocation: "${text}" = undefined`);
  return undefined;
}

function formatLocation({
  city,
  state,
  stateAcronym,
  country,
  countryAcronym,
}: LocationSchema): string {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (state || stateAcronym) {
    if (state && stateAcronym) {
      parts.push(`${state} (${stateAcronym})`);
    } else {
      parts.push(state || stateAcronym);
    }
  }

  if (country || countryAcronym) {
    if (country && countryAcronym) {
      parts.push(`${country} (${countryAcronym})`);
    } else {
      parts.push(country || countryAcronym);
    }
  }

  return parts.join(", ");
}

async function jsonCompletion<T>(
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
