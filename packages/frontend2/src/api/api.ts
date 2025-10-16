import { QueryCache, QueryClient } from "@tanstack/query-core";
import type { Metadata } from "./apiTypes";

const API_URL = import.meta.env["VITE_API_URL"];

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

class APIConnector {
  public async fetchMetadata() {
    return await qc.fetchQuery({
      queryKey: ["metadata"],
      queryFn: () => this.httpCall<Metadata>("metadata"),
    });
  }

  protected async httpCall<T>(url: string): Promise<T> {
    const response = await fetch(`${API_URL}/${url}`, {
      signal: AbortSignal.timeout(10_000),
    });

    const { statusText, ok } = response;

    if (!ok) {
      throw new Error(`API Request Failed: ${statusText}`);
    }

    return (await response.json()) as T;
  }
}

export const api = new APIConnector();
