import { llm } from "../ai/llm.ts";
import type { Filters } from "../models/clientModels.ts";

/**
 * Interprets a natural language search query and returns structured filters.
 * @param query - The natural language search query.
 * @returns The interpreted filters.
 */
export async function interpretFilters(query: string): Promise<Filters> {
  const result = await llm.interpretFilters(query);
  return result;
}
