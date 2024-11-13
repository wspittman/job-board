import { useQuery } from "@tanstack/react-query";
import { fetchJobs, fetchMetadata, Filters } from "./api";

export function useMetadata() {
  return useQuery({
    queryKey: ["metadata"],
    queryFn: fetchMetadata,
    staleTime: Infinity,
  });
}

export function useJobs(filters: Filters) {
  const isEmpty = Object.values(filters).every(
    (v) => v === undefined || v === ""
  );

  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => fetchJobs(filters),
    staleTime: Infinity,
    enabled: !isEmpty,
  });
}
