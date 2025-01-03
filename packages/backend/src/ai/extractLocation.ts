import { db } from "../db/db";
import { Job } from "../db/models";
import { BatchOptions, batchRun } from "../utils/async";
import { LRUCache } from "../utils/cache";
import { logCounter } from "../utils/telemetry";
import { jsonCompletion } from "./llm";

const locationCache = new LRUCache<string, Location>(1000);

const locationPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or hybrid/on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or hybrid/on-site.
Provide the response JSON, using empty string ("") for any unknown fields.`;

type Location = Pick<Job, "isRemote" | "location"> | undefined;

interface LocationSchema {
  remote: boolean;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
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
      city: { type: "string", description: "City name" },
      state: {
        type: "string",
        description:
          "The full English name for the state, province, or subdivision.",
      },
      stateCode: {
        type: "string",
        description:
          "The ISO 3166-2 subdivision code for the subdivision. Examples: 'WA' for Washington, 'TX' for Texas, 'ON' for Ontario.",
      },
      country: {
        type: "string",
        description:
          "The ISO 3166 English short name of the country. Examples: 'United States of America', 'Canada', 'Mexico'.",
      },
      countryCode: {
        type: "string",
        description:
          "The ISO 3166-1 alpha-3 three-letter code for the country. Examples: 'USA' for the United States of America, 'CAN' for Canada, 'MEX' for Mexico.",
      },
    },
    additionalProperties: false,
  },
};

export async function extractLocations(
  texts: string[],
  batchOpts: BatchOptions
): Promise<Location[]> {
  // All original texts -> normalized text
  const normalizeMap = new Map<string, string>();
  // All normalized texts -> an example of original text
  const normalizeExampleMap = new Map<string, string>();
  // All normalized texts -> extracted location object
  const extractMap = new Map<string, Location>();

  // Create the normalization maps
  texts.forEach((text) => {
    const normalizedText = normalize(text);
    normalizeMap.set(text, normalizedText);
    normalizeExampleMap.set(normalizedText, text);
  });

  const normalizedTexts = Array.from(normalizeExampleMap.keys());

  // For each normalization text, extract the location using an example of original text
  await batchRun(
    normalizedTexts,
    async (normalizedText) => {
      const result = await extractLocation(
        normalizeExampleMap.get(normalizedText)!
      );
      extractMap.set(normalizedText, result);
    },
    "ExtractLocation",
    batchOpts
  );

  // Return the extracted location objects in the order of the original texts
  return texts.map((text) => extractMap.get(normalizeMap.get(text)!));
}

export async function extractLocation(text: string): Promise<Location> {
  const normalizedText = normalize(text);

  if (!normalizedText) {
    return undefined;
  }

  const cachedResult = await extractFromCache(normalizedText);

  if (cachedResult) {
    return cachedResult;
  }

  const result = await jsonCompletion<LocationSchema, Location>(
    "extractLocation",
    locationPrompt,
    locationSchema,
    text,
    formatLocation
  );

  insertToCache(normalizedText, result);

  if (result?.isRemote === false && result.location === "") {
    // This means the LLM call couldn't extract a location
    return undefined;
  }

  return result;
}

function normalize(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      // ['/', '\\', '#'] cannot be used in CosmosDB keys (ie. for the DB cache)
      .replace(/[/\\#]/g, "_")
  );
}

async function extractFromCache(text: string): Promise<Location> {
  const cachedResult = locationCache.get(text);

  if (cachedResult) {
    logCounter("ExtractLocation_CacheHit");
    return cachedResult;
  }

  const dbCachedResult = await db.locationCache.getItem(text, text[0]);

  if (dbCachedResult) {
    logCounter("ExtractLocation_DBCacheHit");
    const { isRemote, location } = dbCachedResult;
    locationCache.set(text, { isRemote, location });
    return { isRemote, location };
  }
}

function insertToCache(text: string, result: Location) {
  if (!result) return;

  locationCache.set(text, result);
  // Don't await on cache insertion
  db.locationCache.upsert({
    id: text,
    pKey: text[0],
    ...result,
  });
}

function formatLocation({
  remote,
  city,
  state,
  stateCode,
  country,
  countryCode,
}: LocationSchema): Location {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (state || stateCode) {
    if (state && stateCode) {
      parts.push(`${state} (${stateCode})`);
    } else {
      parts.push(state || stateCode);
    }
  }

  if (country || countryCode) {
    if (country && countryCode) {
      parts.push(`${country} (${countryCode})`);
    } else {
      parts.push(country || countryCode);
    }
  }

  const location = parts.join(", ");

  return {
    isRemote: remote,
    location,
  };
}
