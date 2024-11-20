import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterArea } from "../components/FilterArea";
import { JobCard } from "../components/JobCard";
import { JobTable } from "../components/JobTable";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { Filters, Job } from "../services/api";
import { useMetadata } from "../services/apiHooks";

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
  const [filters, setFilters] = useState<Filters>({});
  const jobCardRef = useRef<HTMLDivElement>(null);

  const updateJob = (job?: Job) => {
    setSelectedJob(job);
    if (jobCardRef.current) {
      jobCardRef.current.scrollTop = 0;
    }
  };
  const clearJob = useCallback(() => updateJob(undefined), []);

  const toggleFilterOpen = () => setIsFilterOpen(!isFilterOpen);
  const updateFilters = (newFilters: Filters) =>
    setFilters({ ...filters, ...newFilters });

  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedFilters = useDebounce(filters, 500);
  const { isLoading, isError } = useMetadata();

  // Update filter state from URL params on initial load
  useEffect(() => {
    const getVal = (key: string) => searchParams.get(key) || undefined;
    const isRemote = getVal("isRemote");
    const maxExperience = Number(getVal("maxExperience"));
    setFilters({
      companyId: getVal("companyId"),
      isRemote: isRemote == undefined ? undefined : isRemote === "true",
      title: getVal("title"),
      location: getVal("location"),
      daysSince: Number(getVal("daysSince")) || undefined,
      maxExperience: maxExperience >= 0 ? maxExperience : undefined,
      minSalary: Number(getVal("minSalary")) || undefined,
    });
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
  }, [debouncedFilters, searchParams, setSearchParams]);

  // Clear selected job when filters change
  useEffect(() => {
    clearJob();
  }, [debouncedFilters, clearJob]);

  return (
    <Stack spacing={2} overflow="hidden">
      {isLoading && <PageLoader />}
      {isError && <PageError />}

      {!isLoading && !isError && (
        <>
          <Button
            onClick={toggleFilterOpen}
            fullWidth
            variant="outlined"
            sx={{
              display: { xs: "block", sm: "none" },
              bgcolor: "background.paper",
            }}
          >
            Show Filters
          </Button>

          <Box display={{ xs: "none", sm: "block" }}>
            <FilterArea {...filters} onChange={updateFilters} />
          </Box>

          <Box gap={2} display="flex" overflow="hidden" minHeight="300px">
            <Box width={selectedJob ? "50%" : "100%"} overflow="auto">
              <JobTable filters={debouncedFilters} onSelect={updateJob} />
            </Box>
            {selectedJob && (
              <Box
                display={{ xs: "none", md: "block" }}
                width="50%"
                overflow="auto"
                ref={jobCardRef}
              >
                <JobCard job={selectedJob} onClose={clearJob} />
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
            <FilterArea {...filters} onChange={updateFilters} />
          </Drawer>

          <Drawer
            open={!!selectedJob}
            onClose={clearJob}
            sx={{ display: { md: "none" } }}
          >
            <Button onClick={clearJob} sx={{ m: 1 }} variant="outlined">
              Close
            </Button>
            {selectedJob && <JobCard job={selectedJob} />}
          </Drawer>
        </>
      )}
    </Stack>
  );
};
