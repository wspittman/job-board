import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
    <Box sx={{ m: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5">{job.title}</Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={iconTextStyle}
          >
            <Building />
            {job.company}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={iconTextStyle}>
            <MapPin />
            {job.location}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={iconTextStyle}>
            <Calendar />
            {new Date(job.postDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
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
    </Box>
  );
};
