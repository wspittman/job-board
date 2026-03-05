import { jsonCompletion } from "dry-utils-openai";
import { config } from "../config.ts";
import type { Filters, InterpretQuery } from "../models/clientModels.ts";
import { ExtractionFilters } from "../models/extractionModels.ts";
import type { Bag } from "../types/types.ts";
import { logProperty } from "../utils/telemetry.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are a job-search assistant. Your goal is to translate a user's natural language search query into a structured set of filters.

# Guidelines

- Analyze the User Query: Extract intent related to job titles, locations, remote preferences, experience levels, salary, and company characteristics.
- Use Context: If 'currentFilters' are provided, treat the new 'query' as a refinement or a change to those filters.
    - If the query adds a new constraint, include it in the output.
    - If the query contradicts an existing filter (e.g., current is 'Remote', query says 'In-person'), include the new value in the output, which will override the old one externally.
- Be Specific: Only set fields that are explicitly mentioned or strongly implied by the query or the combination of query and current filters.
- Capture Unmapped Intent: If the user query contains preferences or constraints that cannot be mapped to the structured fields (e.g., "no early-stage startups", "must use React", "dog-friendly office"), describe them in the 'unmappedIntent' field.
`;

/**
 * Fills in filter information from a natural language search query.
 * @param request The interpretation request containing the query and optional context.
 * @returns The interpreted filters.
 */
export async function fillFilters(request: InterpretQuery): Promise<Filters> {
  const { content } = await jsonCompletion(
    "interpretQuery",
    prompt,
    request.query,
    ExtractionFilters,
    {
      context: createContext(request),
      model: config.LLM_MODEL,
      reasoningEffort: config.LLM_REASONING_EFFORT,
    },
  );

  if (content) {
    const { unmappedIntent, ...extractedFilters } = content;

    if (unmappedIntent) {
      logProperty("Unmapped_Intent", unmappedIntent);
    }

    const mergeFilters = { ...request.filters };
    setExtractedData(mergeFilters, extractedFilters);
    return mergeFilters;
  }

  return request.filters ?? {};
}

function createContext({ filters, locale }: InterpretQuery) {
  const context = [];

  if (filters) {
    context.push({
      description: [
        "Current filters already applied to the search, if any.",
        "The user's query may be a refinement or change to these filters.",
        "Do not duplicate these values in your output.",
      ].join(" "),
      content: filters as Bag,
    });
  }

  if (locale) {
    context.push({
      description: [
        "The user's locale, which may influence job search intent.",
        "Regardless of locale, always respond in English and do not localize or translate filter values.",
      ].join(" "),
      content: { locale },
    });
  }

  return context.length ? context : undefined;
}
