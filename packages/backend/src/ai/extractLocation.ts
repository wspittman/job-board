import { jsonCompletion } from "dry-utils-openai";
import { db } from "../db/db.ts";
import { InferredLocation } from "../models/inferredModels.ts";
import type { Location } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { LRUCache } from "../utils/cache.ts";
import { logCounter, logError } from "../utils/telemetry.ts";
import { setExtractedData } from "./setExtractedData.ts";

const locationCache = new LRUCache<string, Location>(1000);

const prompt = `You are a detail-oriented clerical worker who excels at identifying user intent.
Your goal is to extract location information from a potentially partial human-written text.
Carefully review the text to identify a likely intended location.
Format your response in JSON, adhering to the provided schema. Use null for any fields that cannot be confidently determined.`;

/**
 * Extracts location information.
 * @param location The location object to extract data into
 * @returns True if extraction was successful, false otherwise
 */
export async function extractLocation(
  location: string,
  model?: string
): Promise<Location> {
  if (!location) return {};

  const normalizedText = normalize(location);

  if (!normalizedText) return {};

  const cachedResult = await extractFromCache(normalizedText);

  if (cachedResult) {
    return cachedResult;
  }

  const { content } = await jsonCompletion(
    "extractLocation",
    prompt,
    normalizedText,
    InferredLocation,
    { model }
  );

  if (!content) return {};

  const extractedLocation: Location = {};
  setExtractedData(extractedLocation, content);
  insertToCache(normalizedText, extractedLocation);

  return extractedLocation;
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

async function extractFromCache(text: string): Promise<Location | undefined> {
  try {
    const cachedResult = locationCache.get(text);

    if (cachedResult) {
      logCounter("ExtractLocation_CacheHit");
      return cachedResult;
    }

    const dbCachedResult = await db.locationCache.getItem(text, text[0]!);

    if (dbCachedResult) {
      logCounter("ExtractLocation_DBCacheHit");
      const { city, regionCode, countryCode } = dbCachedResult;
      const cleanedLocation = { city, regionCode, countryCode };
      locationCache.set(text, cleanedLocation);
      return cleanedLocation;
    }
  } catch (e) {
    logError(new AppError("Location cache: Failed to extract", undefined, e));
  }

  return undefined;
}

function insertToCache(text: string, result: Location) {
  try {
    if (!result) return;

    locationCache.set(text, result);
    // Don't await on cache insertion
    db.locationCache.upsertItem({
      id: text,
      pKey: text[0]!,
      ...result,
    });
  } catch (e) {
    logError(new AppError("Location cache: Failed to insert", undefined, e));
  }
}
