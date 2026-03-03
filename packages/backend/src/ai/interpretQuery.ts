import type { Filters, InterpretQuery } from "../models/clientModels.ts";

/**
 * Interprets a natural language search query and returns structured filters.
 * Currently hardcoded for skeleton implementation.
 * @param request - The interpretation request containing the query and optional context.
 * @returns The interpreted filters.
 */
export async function interpretQuery(
  request: InterpretQuery,
): Promise<Filters> {
  // Skeleton implementation: return a fixed set of filters for now
  const mockFilters: Filters = {
    title: "Software Engineer",
    isRemote: true,
    ...request.filters,
  };

  return Promise.resolve(mockFilters);
}
