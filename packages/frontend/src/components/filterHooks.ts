import { useMemo } from "react";
import { Filters } from "../services/api";
import { useMetadata } from "../services/apiHooks";

export function useCompanyFilter(filters: Filters) {
  const { data: metadata } = useMetadata();

  const companyOptions = useMemo(() => {
    const companyNames = metadata?.companyNames || [];
    return companyNames.map(([id, name]) => ({ id, label: name }));
  }, [metadata]);

  const companyValue = useMemo(() => {
    return companyOptions.find((c) => c.id === filters.companyId) ?? null;
  }, [companyOptions, filters.companyId]);

  return { companyOptions, companyValue };
}

export function useIsRemoteFilter(filters: Filters) {
  return useMemo(() => {
    if (filters.isRemote === undefined) return "";
    return filters.isRemote ? "true" : "false";
  }, [filters.isRemote]);
}

export function useTitleFilter(filters: Filters) {
  return useMemo(() => {
    return filters.title || "";
  }, [filters.title]);
}

export function useLocationFilter(filters: Filters) {
  return useMemo(() => {
    return filters.location || "";
  }, [filters.location]);
}

export function usePostSinceFilter(filters: Filters) {
  return useMemo(() => {
    return filters.daysSince || 0;
  }, [filters.daysSince]);
}
