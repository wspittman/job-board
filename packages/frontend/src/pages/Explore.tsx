import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import { useEffect, useState } from "react";
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

  const toggleFilterOpen = () => setIsFilterOpen(!isFilterOpen);
  const clearJob = () => setSelectedJob(undefined);
  const updateFilters = (newFilters: Filters) =>
    setFilters({ ...filters, ...newFilters });

  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedFilters = useDebounce(filters, 500);
  const { isLoading, isError } = useMetadata();

  // Update filter state from URL params on initial load
  useEffect(() => {
    const getVal = (key: string) => searchParams.get(key) || undefined;
    const isRemote = getVal("isRemote");
    setFilters({
      companyId: getVal("companyId"),
      isRemote: isRemote == undefined ? undefined : isRemote === "true",
      title: getVal("title"),
      location: getVal("location"),
      daysSince: Number(getVal("daysSince")) || undefined,
      maxExperience: Number(getVal("maxExperience")) || undefined,
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

  return (
    <Container maxWidth={false}>
      {isLoading && <PageLoader />}
      {isError && <PageError />}

      {!isLoading && !isError && (
        <>
          <Box sx={{ display: { xs: "block", sm: "none" }, m: 1 }}>
            <Button onClick={toggleFilterOpen} fullWidth variant="outlined">
              Show Filters
            </Button>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <FilterArea {...filters} onChange={updateFilters} />
          </Box>

          <Box sx={{ display: "flex", overflow: "hidden" }}>
            <Box sx={{ flexGrow: 1, overflow: "auto" }}>
              <JobTable filters={debouncedFilters} onSelect={setSelectedJob} />
            </Box>
            {selectedJob && (
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  width: "50%",
                  overflow: "auto",
                }}
              >
                <JobCard job={selectedJob} />
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
            sx={{ display: { sm: "none" } }}
          >
            <Button onClick={clearJob} sx={{ m: 1 }} variant="outlined">
              Close
            </Button>
            {selectedJob && <JobCard job={selectedJob} />}
          </Drawer>
        </>
      )}
    </Container>
  );
};
