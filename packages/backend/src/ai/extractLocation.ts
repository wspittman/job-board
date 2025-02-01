import { z } from "zod";
import { db } from "../db/db";
import type { Job } from "../types/dbModels";
import type { Context } from "../types/types";
import { LRUCache } from "../utils/cache";
import { logCounter } from "../utils/telemetry";
import { zBoolean, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

type Location = Pick<Job, "isRemote" | "location"> | undefined;

const locationCache = new LRUCache<string, Location>(1000);

const prompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or hybrid/on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or hybrid/on-site.
Provide the response JSON, using null for any unknown fields.`;

const schema = z.object({
  remote: zBoolean("true for full remote jobs"),
  city: zString("City name"),
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
});

/**
 * Extracts location information from and update a job object.
 * @param job The job object
 */
export async function extractLocations(job: Context<Job>): Promise<void> {
  const location = await extractLocation(
    JSON.stringify({
      location: job.item.location,
      context: job.context,
    })
  );

  if (!location) return;

  setExtractedData(job.item, location);
}

/**
 * Extracts location information from a text string.
 * @param text The location text to analyze
 * @returns Location object containing isRemote flag and formatted location string, or undefined if location cannot be determined
 */
export async function extractLocation(text: string): Promise<Location> {
  const normalizedText = normalize(text);

  if (!normalizedText) {
    return undefined;
  }

  const cachedResult = await extractFromCache(normalizedText);

  if (cachedResult) {
    return cachedResult;
  }

  const result = await jsonCompletion("extractLocation", prompt, schema, text);

  if (!result) {
    return undefined;
  }

  const location = formatLocation(result);

  insertToCache(normalizedText, location);

  if (location?.isRemote === false && location.location === "") {
    // This means the LLM call couldn't extract a location
    return undefined;
  }

  return location;
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
  db.locationCache.upsertItem({
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
}: z.infer<typeof schema>): Location {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (state || stateCode) {
    if (state && stateCode) {
      parts.push(`${state} (${stateCode})`);
    } else {
      parts.push(state || stateCode!);
    }
  }

  if (country || countryCode) {
    if (country && countryCode) {
      parts.push(`${country} (${countryCode})`);
    } else {
      parts.push(country || countryCode!);
    }
  }

  const location = parts.join(", ");

  return {
    isRemote: !!remote,
    location,
  };
}
