import { useState } from "react";
import { FilterArea } from "../components/FilterArea";
import { JobTable } from "../components/JobTable";
import { Filters } from "../services/api";
import { useJobs } from "../services/apiHooks";

export const Explore = () => {
  const [filters, setFilters] = useState<Filters>({});

  const { data = [], isLoading, isError } = useJobs(filters);

  return (
    <div>
      <FilterArea filters={filters} onChange={setFilters} />
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}
      <JobTable jobs={data} onSelect={() => {}} />
    </div>
  );
};
