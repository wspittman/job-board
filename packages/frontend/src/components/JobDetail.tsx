import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Building, Calendar, MapPin, X } from "lucide-react";
import { Job } from "../services/api";

const iconTextStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

interface Props {
  job: Job;
  onClose?: () => void;
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

export const JobDetail = ({ job, onClose }: Props) => {
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
          >
            Apply
          </Button>
        </Grid>
        {onClose && (
          <Grid size={1}>
            <IconButton size="large" onClick={onClose}>
              <X />
            </IconButton>
          </Grid>
        )}
        <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
          <Building />
          {job.company}
        </Typography>
        {job.location && (
          <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
            <MapPin />
            {job.location}
          </Typography>
        )}
        <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
          <Calendar />
          {new Date(job.postTS).toLocaleDateString()}
        </Typography>
      </Grid>
      <StyledDescription
        dangerouslySetInnerHTML={{ __html: job.description }}
      />
    </Paper>
  );
};
