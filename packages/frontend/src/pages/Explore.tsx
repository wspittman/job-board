import { useEffect, useState } from "react";
import { FilterArea } from "../components/FilterArea";
import { JobTable } from "../components/JobTable";
import { Filters } from "../services/api";
import { useJobs } from "../services/apiHooks";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export const Explore = () => {
  const [filters, setFilters] = useState<Filters>({});

  const debouncedFilters = useDebounce(filters, 500);

  const { data = [], isLoading, isError } = useJobs(debouncedFilters);

  return (
    <div>
      <FilterArea filters={filters} onChange={setFilters} />
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}
      <JobTable jobs={data} onSelect={() => {}} />
    </div>
  );
};
