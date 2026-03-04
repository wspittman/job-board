import { llm } from "../ai/llm.ts";
import type { Filters, InterpretQuery } from "../models/clientModels.ts";

/**
 * Interprets a natural language search query and returns structured filters.
 * @param request - The interpretation request containing the query and optional context.
 * @returns The interpreted filters.
 */
export async function interpretQuery(
  request: InterpretQuery,
): Promise<Filters> {
  const result = await llm.fillFilters(request);
  return result;
}
