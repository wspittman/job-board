import Grid from "@mui/material/Grid2";
import { Job } from "../services/api";
import { JobCard } from "./JobCard";

const cardSize = { xs: 12, sm: 6, lg: 4 };

interface Props {
  jobs?: Job[];
  selectedId?: string;
  onSelect: (selected: Job) => void;
}

function infoMessage(jobs?: Job[]) {
  switch (jobs?.length ?? -1) {
    case -1:
      return [
        "Add Filters To Begin",
        "Try to have fun with it!",
        "As you apply filters, jobs will begin appearing here. We'll return the first 24 matches we find for your filter set. You can always adjust your filters until you have a great set of matches.",
      ];
    case 0:
      return [
        "No Matches Found",
        "Try adjusting your filters.",
        "You may need to loosen your filters to find matches. Or maybe we don't have good jobs posted for you yet. =(",
      ];
    case 24:
      return [
        "24 Matches Shown",
        "More are available!",
        "By adjusting your filters you can narrow down the results until you have only the best matches for you.",
      ];
    default:
      return [
        "All Matches Shown",
        "Are these great matches?",
        "If these are great matches, bookmark this page to rerun the search later. New jobs are being posted every day! If the matches aren't quite right, try adjusting your filters until they are.",
      ];
  }
}

/**
 * Grid layout component that displays a collection of job cards
 * @param jobs Array of jobs to display
 * @param selectedId ID of the currently selected job
 * @param onSelect Callback function when a job is selected
 */
export const JobGrid = ({ jobs, selectedId, onSelect }: Props) => {
  const [infoPrimary, infoSecondary, infoTertiary] = infoMessage(jobs);

  return (
    <Grid container spacing={2}>
      {jobs &&
        jobs.map((job) => (
          <Grid key={job.id} marginBottom={2} size={cardSize}>
            <JobCard
              job={job}
              selected={selectedId === job.id}
              onClick={() => onSelect(job)}
            />
          </Grid>
        ))}
      <Grid marginBottom={2} size={cardSize}>
        <JobCard
          job={
            {
              title: infoPrimary,
              company: infoSecondary,
              facets: {
                summary: infoTertiary,
              },
            } as Job
          }
        />
      </Grid>
    </Grid>
  );
};
