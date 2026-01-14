import { QueryCache, QueryClient } from "@tanstack/query-core";
import type { JobModelApi, MetadataModelApi } from "./apiTypes";

const viteApiUrl = import.meta.env["VITE_API_URL"] as unknown;
const apiUrlString = typeof viteApiUrl === "string" ? viteApiUrl.trim() : "";
export const API_URL = apiUrlString.replace(/\/+$/, "") || "/api";

const VISITOR_ID_STORAGE = "v_id";
const SESSION_ID_STORAGE = "s_id";
const VISITOR_ID_HEADER = "x-vid";
const SESSION_ID_HEADER = "x-sid";

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
    const headers = new Headers();

    const visitorId = this.#getStorageId("local", VISITOR_ID_STORAGE);
    const sessionId = this.#getStorageId("session", SESSION_ID_STORAGE);

    if (visitorId) {
      headers.set(VISITOR_ID_HEADER, visitorId);
    }

    if (sessionId) {
      headers.set(SESSION_ID_HEADER, sessionId);
    }

    const response = await fetch(`${API_URL}/${trimmedUrl}`, {
      signal: AbortSignal.timeout(10_000),
      headers,
    });

    const { statusText, ok } = response;

    if (!ok) {
      throw new Error(`API Request Failed: ${statusText}`);
    }

    return (await response.json()) as T;
  }

  #getStorageId(area: "local" | "session", key: string): string | undefined {
    try {
      const storage =
        area === "local" ? window.localStorage : window.sessionStorage;
      let id = storage.getItem(key) ?? undefined;

      if (!id) {
        id = window.crypto.randomUUID();
        storage.setItem(key, id);
      }

      return id;
    } catch {
      return undefined;
    }
  }
}

export const api = new APIConnector();
