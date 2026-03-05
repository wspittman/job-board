import { jsonCompletion } from "dry-utils-openai";
import { config } from "../config.ts";
import type { Filters } from "../models/clientModels.ts";
import { ExtractionFilters } from "../models/extractionModels.ts";
import { normalizedLocation } from "../utils/location.ts";
import { logProperty } from "../utils/telemetry.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are a job-search assistant. Your goal is to translate a user's natural language search query into a structured set of filters.

# Guidelines

- Analyze the User Query: Extract intent related to job titles, locations, remote preferences, experience levels, salary, and company characteristics.
- Be Specific: Only set fields that are explicitly mentioned or strongly implied by the query.
- Capture Unmapped Intent: If the user query contains preferences or constraints that cannot be mapped to the structured fields (e.g., "no early-stage startups", "must use React", "dog-friendly office"), describe them in the 'unmappedIntent' field.
`;

/**
 * Interprets filter information from a natural language search query.
 * @param query The user's natural language search query.
 * @returns The interpreted filters.
 */
export async function interpretFilters(query: string): Promise<Filters> {
  if (!query) return {};

  const { content } = await jsonCompletion(
    "interpretQuery",
    prompt,
    query,
    ExtractionFilters,
    {
      model: config.LLM_MODEL,
      reasoningEffort: config.LLM_REASONING_EFFORT,
    },
  );

  if (!content) return {};

  const { unmappedIntent, ...extractedFilters } = content;

  if (unmappedIntent) {
    logProperty("Unmapped_Intent", unmappedIntent);
  }

  // Map content to Filters object
  const extractIsRemote = extractedFilters.isRemote.trim().toLowerCase();
  const isRemote = !extractIsRemote ? undefined : extractIsRemote === "true";
  const mappedContent: Filters = {
    ...extractedFilters,
    isRemote,
    location: normalizedLocation(extractedFilters.location),
  } as Filters;

  const result: Filters = {};
  setExtractedData(result, mappedContent);
  return result;
}
