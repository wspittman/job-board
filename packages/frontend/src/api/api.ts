import { QueryCache, QueryClient } from "@tanstack/query-core";
import { getStorageIds } from "../utils/storage";
import type { FilterModelApi, JobModelApi, MetadataModelApi } from "./apiTypes";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // data is fresh for 1 hour
      staleTime: 60 * 60_000,
    },
  },
  queryCache: new QueryCache(),
});

/**
 * Handles API requests and data fetching for the frontend application.
 * Uses TanStack Query for caching and deduplication of requests.
 */
class APIConnector {
  /**
   * Fetches metadata from the API.
   * @returns The metadata information.
   */
  public async fetchMetadata(): Promise<MetadataModelApi> {
    return await qc.fetchQuery({
      queryKey: ["metadata"],
      queryFn: () => this.#httpCall<MetadataModelApi>("metadata"),
    });
  }

  /**
   * Fetches job listings based on the provided filters.
   * @param params - The query string parameters to apply to the job search.
   * @returns The list of job models matching the filters.
   */
  public async fetchJobs(params: string): Promise<JobModelApi[]> {
    if (!params) return [];

    return await qc.fetchQuery({
      queryKey: ["jobs", params],
      queryFn: () => this.#httpCall<JobModelApi[]>(`jobs?${params}`),
    });
  }

  /**
   * Translates a natural language query into structured filters.
   * @param query - The natural language search query.
   * @param filters - Optional current filters for refinement.
   * @returns The interpreted filters.
   */
  public async interpretQuery(
    query: string,
    filters?: FilterModelApi,
  ): Promise<FilterModelApi> {
    return await this.#httpCall<FilterModelApi>("interpret", "POST", {
      query,
      filters,
    });
  }

  /**
   * Makes an HTTP call to the API.
   * @param url - The URL endpoint to call.
   * @param method - The HTTP method to use (defaults to GET).
   * @param body - The request body (for POST/PUT requests).
   * @returns The response data as type T.
   */
  async #httpCall<T>(
    url: string,
    method: "GET" | "POST" = "GET",
    body?: unknown,
  ): Promise<T> {
    const trimmedUrl = url.replace(/^\/+/, "");
    const headers = new Headers(getStorageIds("headers"));

    if (body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`api/${trimmedUrl}`, {
      method,
      signal: AbortSignal.timeout(10_000),
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const { statusText, ok } = response;

    if (!ok) {
      throw new Error(`API Request Failed: ${statusText}`);
    }

    return (await response.json()) as T;
  }
}

export const api = new APIConnector();
