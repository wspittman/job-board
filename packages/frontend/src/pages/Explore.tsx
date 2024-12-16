import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterArea } from "../components/FilterArea";
import { JobDetail } from "../components/JobDetail";
import { JobGrid } from "../components/JobGrid";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { Filters, Job } from "../services/api";
import { useJobs, useMetadata } from "../services/apiHooks";

/**
 * Custom hook that debounces a value by delaying its update
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Converts URL search parameters to a Filters object
 * @param searchParams URLSearchParams object containing filter parameters
 * @returns Filters object with parsed values
 */
function urlToFilters(searchParams: URLSearchParams): Filters {
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
function useFilters() {
  const [filters, setFilters] = useState<Filters>({});
  const debouncedFilters = useDebounce(filters, 500);
  const [searchParams, setSearchParams] = useSearchParams();

  // Update filter state from URL params on initial load
  useEffect(() => {
    setFilters(urlToFilters(searchParams));
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

/**
 * Main explore page component that displays job listings with filtering capabilities
 * Shows a grid of jobs and detailed view with responsive layout
 */
export const Explore = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job>();
  const jobCardRef = useRef<HTMLDivElement>(null);

  const { filters, debouncedFilters, updateFilters } = useFilters();
  const { isLoading: metaLoading, isError: metaError } = useMetadata();
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    isError: jobsError,
  } = useJobs(debouncedFilters);

  const toggleFilterOpen = () => setIsFilterOpen(!isFilterOpen);
  const selectJob = (job?: Job) => {
    setSelectedJob(job);
    if (jobCardRef.current) {
      jobCardRef.current.scrollTop = 0;
    }
  };
  const clearJob = () => {
    selectJob();
    setIsDetailOpen(false);
  };
  const selectJobAndOpen = (job: Job) => {
    selectJob(job);
    setIsDetailOpen(true);
  };

  // Select first job when list changes
  useEffect(() => {
    selectJob(jobs[0]);
  }, [jobs]);

  if (metaLoading) return <PageLoader />;
  if (metaError) return <PageError />;

  return (
    <Stack spacing={2} overflow="hidden">
      <Button
        onClick={toggleFilterOpen}
        fullWidth
        variant="outlined"
        sx={{
          display: { xs: "block", md: "none" },
          bgcolor: "background.paper",
        }}
      >
        Show Filters
      </Button>

      <Box display={{ xs: "none", md: "block" }}>
        <FilterArea {...filters} onChange={updateFilters} />
      </Box>

      {jobsLoading && <PageLoader />}
      {jobsError && <PageError />}
      {!jobsLoading && !jobsError && (
        <Box gap={2} display="flex" overflow="hidden" minHeight="300px">
          <Box width={{ xs: "100%", md: "50%" }} overflow="auto">
            <JobGrid
              jobs={jobs}
              selectedId={selectedJob?.id}
              onSelect={selectJobAndOpen}
            />
          </Box>
          <Box
            display={{ xs: "none", md: "block" }}
            width="50%"
            overflow="auto"
            ref={jobCardRef}
          >
            <JobDetail job={selectedJob} />
          </Box>
        </Box>
      )}

      <Drawer
        open={isFilterOpen}
        onClose={toggleFilterOpen}
        sx={{ display: { md: "none" } }}
      >
        <Button onClick={toggleFilterOpen} sx={{ m: 1 }} variant="outlined">
          Close
        </Button>
        <FilterArea {...filters} onChange={updateFilters} />
      </Drawer>

      <Drawer
        open={!!isDetailOpen}
        onClose={clearJob}
        sx={{ display: { md: "none" } }}
      >
        <Button onClick={clearJob} sx={{ m: 1 }} variant="outlined">
          Close
        </Button>
        <JobDetail job={selectedJob} />
      </Drawer>
    </Stack>
  );
};
