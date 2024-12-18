import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import { useEffect, useRef, useState } from "react";
import { FilterArea } from "../components/FilterArea";
import { JobDetail } from "../components/JobDetail";
import { JobGrid } from "../components/JobGrid";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { useFilters } from "../hooks/filterHooks";
import { Job } from "../services/api";
import { useJobs, useMetadata } from "../services/apiHooks";

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
