import { z } from "zod";
import { db } from "../db/db";
import type { Location } from "../types/dbModels";
import { LRUCache } from "../utils/cache";
import { logCounter } from "../utils/telemetry";
import { zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const locationCache = new LRUCache<string, Location>(1000);

const prompt = `You are a detail-oriented clerical worker who excels at identifying user intent.
Your goal is to extract location information from a potentially partial human-written text.
Carefully review the text to identify a likely intended location.
Format your response in JSON, adhering to the provided schema. Use null for any fields that cannot be confidently determined.`;

const schema = z.object({
  city: zString("City name."),
  state: zString(
    "The full English name for the state, province, or subdivision."
  ),
  stateCode: zString(
    "The ISO 3166-2 subdivision code for the subdivision. Examples: 'WA' for Washington, 'TX' for Texas, 'ON' for Ontario."
  ),
  country: zString(
    "The ISO 3166 English short name of the country. Examples: 'United States of America', 'Canada', 'Mexico'."
  ),
  countryCode: zString(
    "The ISO 3166-1 alpha-3 three-letter code for the country. Examples: 'USA' for the United States of America, 'CAN' for Canada, 'MEX' for Mexico."
  ),
  timezone: zString("The IANA timezone identifier for the location."),
});

/**
 * Extracts location information from a text string.
 * @param text The location text to analyze
 * @returns The extracted location information
 */
export async function extractLocation(location: Location): Promise<boolean> {
  if (!location.location) return false;

  const normalizedText = normalize(location.location);

  if (!normalizedText) return false;

  const cachedResult = await extractFromCache(normalizedText);

  if (cachedResult) {
    Object.assign(location, cachedResult);
    return true;
  }

  const result = await jsonCompletion(
    "extractLocation",
    prompt,
    schema,
    normalizedText
  );

  if (!result) return false;

  const extractedLocation: Location = {};
  setExtractedData(extractedLocation, result);
  insertToCache(normalizedText, extractedLocation);

  if (!Object.keys(extractedLocation).length) {
    // This means the LLM call couldn't extract a location
    return false;
  }

  Object.assign(location, extractedLocation);
  return true;
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

async function extractFromCache(text: string) {
  const cachedResult = locationCache.get(text);

  if (cachedResult) {
    logCounter("ExtractLocation_CacheHit");
    return cachedResult;
  }

  const dbCachedResult = await db.locationCache.getItem(text, text[0]);

  if (dbCachedResult) {
    logCounter("ExtractLocation_DBCacheHit");
    return dbCachedResult;
  }
}

function insertToCache(text: string, result: Location) {
  if (!result) return;

  locationCache.set(text, result);
  // Don't await on cache insertion
  db.locationCache.upsertItem({
    id: text,
    pKey: text[0],
    ...result,
  });
}
