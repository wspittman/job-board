import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
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

export const JobCard = ({ job }: Props) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
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
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        {job.description}
      </Typography>
    </Paper>
  );
};
