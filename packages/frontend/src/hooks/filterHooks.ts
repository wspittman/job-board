import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filters } from "../services/api";
import { useDebounce } from "./utilHooks";

/**
 * Initialize a Filters object from URL search parameters
 * @param searchParams URLSearchParams object containing filter parameters
 * @returns Filters object with parsed values
 */
function initFilters(searchParams: URLSearchParams): Filters {
  const getVal = (key: string) => searchParams.get(key) || undefined;
  const isRemote = getVal("isRemote");
  const maxExperience = Number(getVal("maxExperience"));
  return {
    companyId: getVal("companyId"),
    isRemote: isRemote == undefined ? undefined : isRemote === "true",
    title: getVal("title"),
    location: getVal("location"),
    daysSince: Number(getVal("daysSince")) || undefined,
    maxExperience: maxExperience >= 0 ? maxExperience : undefined,
    minSalary: Number(getVal("minSalary")) || undefined,
  };
}

/**
 * Custom hook that manages filter state and synchronizes with URL parameters
 * @returns Object containing filters, debounced filters, and update function
 */
export function useFilters() {
  const [filters, setFilters] = useState<Filters>({});
  const debouncedFilters = useDebounce(filters, 500);
  const [searchParams, setSearchParams] = useSearchParams();

  // Update filter state from URL params on initial load
  useEffect(() => {
    setFilters(initFilters(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL params when filter state changes
  useEffect(() => {
    const newParams = new URLSearchParams();
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [debouncedFilters, setSearchParams]);

  return {
    filters,
    debouncedFilters,
    updateFilters: (newFilters: Filters) =>
      setFilters({ ...filters, ...newFilters }),
  };
}
