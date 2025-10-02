import { jsonCompletion } from "dry-utils-openai";
import { config } from "../config.ts";
import { getCachedLocation, setCachedLocation } from "../db/cache.ts";
import { ExtractionLocation } from "../models/extractionModels.ts";
import type { Location } from "../models/models.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are a detail-oriented clerical worker who excels at identifying user intent.
Your goal is to extract location information from a potentially partial human-written text.
Carefully review the text to identify a likely intended location.
Format your response in JSON, adhering to the provided schema. Use null for any fields that cannot be confidently determined.`;

/**
 * Extracts location information.
 * @param location The location object to extract data into
 * @returns True if extraction was successful, false otherwise
 */
export async function extractLocation(location: string): Promise<Location> {
  if (!location) return {};

  const cachedResult = await getCachedLocation(location);

  if (cachedResult) {
    return cachedResult;
  }

  const { content } = await jsonCompletion(
    "extractLocation",
    prompt,
    location,
    ExtractionLocation,
    { model: config.LLM_MODEL }
  );

  if (!content) return {};

  const extractedLocation: Location = {};
  setExtractedData(extractedLocation, content);
  setCachedLocation(location, extractedLocation);

  return extractedLocation;
}
