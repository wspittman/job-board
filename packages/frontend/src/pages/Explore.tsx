import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { FilterArea } from "../components/FilterArea";
import { JobTable } from "../components/JobTable";
import { Filters, Job } from "../services/api";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job>();

  const toggleFilterOpen = () => setIsFilterOpen(!isFilterOpen);
  const clearJob = () => setSelectedJob(undefined);

  const [filters, setFilters] = useState<Filters>({});

  const debouncedFilters = useDebounce(filters, 500);

  const { data = [], isLoading, isError } = useJobs(debouncedFilters);

  return (
    <>
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}

      <Box sx={{ display: { xs: "block", sm: "none" }, m: 1 }}>
        <Button onClick={toggleFilterOpen} fullWidth variant="outlined">
          Show Filters
        </Button>
      </Box>

      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <FilterArea filters={filters} onChange={setFilters} />
      </Box>

      <Box sx={{ display: "flex", overflow: "hidden" }}>
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <JobTable jobs={data} onSelect={setSelectedJob} />
        </Box>
        {selectedJob && (
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: "50%",
              overflow: "auto",
            }}
          >
            <Typography>{selectedJob?.description}</Typography>
          </Box>
        )}
      </Box>

      <Drawer
        open={isFilterOpen}
        onClose={toggleFilterOpen}
        sx={{ display: { sm: "none" } }}
      >
        <Button onClick={toggleFilterOpen} sx={{ m: 1 }} variant="outlined">
          Close
        </Button>
        <FilterArea filters={filters} onChange={setFilters} />
      </Drawer>

      <Drawer
        open={selectedJob !== undefined}
        onClose={clearJob}
        sx={{ display: { sm: "none" } }}
      >
        <Button onClick={clearJob} sx={{ m: 1 }} variant="outlined">
          Close
        </Button>
        <Typography>{selectedJob?.description}</Typography>
      </Drawer>
    </>
  );
};
