import { QueryCache, QueryClient } from "@tanstack/query-core";
import type { JobModel, MetadataModelApi } from "./apiTypes";
import type { FilterModel } from "./filterModel";

const viteApiUrl = import.meta.env["VITE_API_URL"];
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

class APIConnector {
  public async fetchMetadata() {
    return await qc.fetchQuery({
      queryKey: ["metadata"],
      queryFn: () => this.httpCall<MetadataModelApi>("metadata"),
    });
  }

  public async fetchJobs(filters: FilterModel): Promise<JobModel[]> {
    if (filters.isEmpty()) return [];

    const params = filters.toUrlSearchParams().toString();
    return await qc.fetchQuery({
      queryKey: ["jobs", params],
      queryFn: () => this.httpCall<JobModel[]>(`jobs?${params}`),
    });
  }

  protected async httpCall<T>(url: string): Promise<T> {
    const trimmedUrl = url.replace(/^\/+/, "");

    const response = await fetch(`${API_URL}/${trimmedUrl}`, {
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
