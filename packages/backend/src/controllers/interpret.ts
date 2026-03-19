import { llm } from "../ai/llm.ts";
import type { Filters } from "../models/clientModels.ts";
import { logProperty } from "../utils/telemetry.ts";

/**
 * Interprets a natural language search query and returns structured filters.
 * @param query - The natural language search query.
 * @returns The interpreted filters.
 */
export async function interpretFilters(query: string): Promise<Filters> {
  const result = await llm.interpretFilters(query);
  logProperty("interpretFilters", result);
  return result;
}
