import { jsonCompletion } from "dry-utils-openai";
import { getLLMOptions } from "../config.ts";
import { getCachedLocation, setCachedLocation } from "../db/cache.ts";
import { ExtractionFilters } from "../models/extractionModels.ts";

const prompt = `You are a detail-oriented clerical worker who excels at normalizing location input.
Your goal is to take a potentially misspelled, abbreviated, or informal city name and return the correct, properly capitalized English city name.
Return an empty string if the input is not a recognizable city name.`;

/**
 * Normalizes a city name using an LLM.
 * @param city The potentially misspelled or informal city name to normalize.
 * @returns The normalized city name, or undefined if the input is not a recognizable city.
 */
export async function extractLocation(
  city: string,
): Promise<string | undefined> {
  city = city.trim();
  if (!city) return undefined;

  const cachedResult = await getCachedLocation(city);
  if (cachedResult) {
    return cachedResult;
  }

  const { content } = await jsonCompletion(
    "extractLocation",
    prompt,
    city,
    ExtractionFilters.pick({ city: true }),
    getLLMOptions("extractLocation"),
  );

  if (!content) return undefined;

  const normalizedCity = content.city;
  if (normalizedCity) {
    setCachedLocation(city, normalizedCity);
  }

  return normalizedCity;
}
