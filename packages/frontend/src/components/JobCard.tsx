import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Building, Calendar, MapPin } from "lucide-react";
import { Job } from "../services/api";

const iconTextStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1,
};

interface Props {
  job: Job;
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

export const JobCard = ({ job }: Props) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" marginBottom={2}>
        <Box>
          <Typography variant="h4">{job.title}</Typography>
          <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
            <Building />
            {job.company}
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
            <MapPin />
            {job.location}
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={iconTextStyle}>
            <Calendar />
            {new Date(job.postTS).toLocaleDateString()}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            size="large"
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply
          </Button>
        </Box>
      </Box>
      <StyledDescription
        dangerouslySetInnerHTML={{ __html: job.description }}
      />
    </Paper>
  );
};
