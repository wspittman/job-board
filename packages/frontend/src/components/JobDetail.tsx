import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Building, Calendar, MapPin } from "lucide-react";
import { Job } from "../services/api";
import { IconTypography } from "./IconTypography";

interface Props {
  job?: Job;
}

// Create styled component that inherits MUI typography styles
const StyledDescription = styled("div")(({ theme }) => ({
  "& p": {
    ...theme.typography.body2,
  },
  "& h1": {
    ...theme.typography.h2,
  },
  "& h2": {
    ...theme.typography.h3,
  },
  "& h3": {
    ...theme.typography.h4,
  },
  "& ul, & ol": {
    ...theme.typography.body2,
  },
}));

/**
 * Component that displays detailed information about a job posting
 * @param job The job details to display
 */
export const JobDetail = ({ job }: Props) => {
  if (!job) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 9 }}>
          <Typography variant="h4">{job.title}</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Apply for ${job.title} position at ${job.company}`}
          >
            Apply
          </Button>
        </Grid>
        <IconTypography
          Icon={Building}
          text={job.company}
          variant="h5"
          color="text.secondary"
        />
        <IconTypography
          Icon={MapPin}
          text={job.location}
          variant="h5"
          color="text.secondary"
        />
        <IconTypography
          Icon={Calendar}
          text={new Date(job.postTS).toLocaleDateString()}
          variant="h5"
          color="text.secondary"
        />
      </Grid>
      <StyledDescription
        dangerouslySetInnerHTML={{ __html: job.description }}
      />
    </Paper>
  );
};
