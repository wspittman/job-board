import { QueryCache, QueryClient } from "@tanstack/query-core";
import { getStorageIds } from "../utils/storage";
import type { JobModelApi, MetadataModelApi } from "./apiTypes";

const viteApiUrl = import.meta.env["VITE_API_URL"] as unknown;
const apiUrlString = typeof viteApiUrl === "string" ? viteApiUrl.trim() : "";
export const API_URL = apiUrlString.replace(/\/+$/, "") || "/api";

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
   * Makes an HTTP call to the API.
   * @param url - The URL endpoint to call.
   * @returns The response data as type T.
   */
  async #httpCall<T>(url: string): Promise<T> {
    const trimmedUrl = url.replace(/^\/+/, "");

    const response = await fetch(`${API_URL}/${trimmedUrl}`, {
      signal: AbortSignal.timeout(10_000),
      headers: new Headers(getStorageIds("headers")),
    });

    const { statusText, ok } = response;

    if (!ok) {
      throw new Error(`API Request Failed: ${statusText}`);
    }

    return (await response.json()) as T;
  }
}

export const api = new APIConnector();
