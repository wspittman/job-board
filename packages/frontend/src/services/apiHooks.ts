import { useQuery } from "@tanstack/react-query";
import { fetchJobs, fetchMetadata, ping } from "./api";

export function usePing() {
  return useQuery({
    queryKey: ["ping"],
    queryFn: ping,
    staleTime: Infinity,
  });
}

export function useMetadata() {
  return useQuery({
    queryKey: ["metadata"],
    queryFn: fetchMetadata,
    staleTime: Infinity,
  });
}

export function useJobs(companyId: string) {
  return useQuery({
    queryKey: ["jobs", companyId],
    queryFn: () => fetchJobs(companyId),
    staleTime: Infinity,
    enabled: !!companyId,
  });
}
