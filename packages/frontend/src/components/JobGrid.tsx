import Grid from "@mui/material/Grid2";
import { Job } from "../services/api";
import { JobCard } from "./JobCard";

interface Props {
  jobs: Job[];
  selectedId?: string;
  onSelect: (selected: Job) => void;
}

export const JobGrid = ({ jobs, selectedId, onSelect }: Props) => {
  return (
    <Grid container spacing={2}>
      {jobs.map((job) => (
        <Grid key={job.id} marginBottom={2} size={{ xs: 12, md: 6, lg: 4 }}>
          <JobCard
            job={job}
            selected={selectedId === job.id}
            onClick={() => onSelect(job)}
          />
        </Grid>
      ))}
    </Grid>
  );
};
