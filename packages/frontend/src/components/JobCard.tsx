import { Paper } from "@mui/material";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Briefcase, Clock, DollarSign, MapPin } from "lucide-react";
import { Job } from "../services/api";
import { IconTypography } from "./IconTypography";

interface Props {
  job: Job;
  selected?: boolean;
  onClick?: () => void;
}

interface DisplayChipProps {
  condition?: boolean;
  label: string;
}

/**
 * Renders a chip component if the condition is true
 * @param condition Boolean determining if the chip should be displayed
 * @param label Text to display in the chip
 */
const DisplayChip = ({ condition, label }: DisplayChipProps) => {
  if (!condition) return null;
  return <Chip size="small" label={label} color="primary" variant="outlined" />;
};

/**
 * Card component that displays a job posting summary
 * @param job The job to display
 * @param selected Whether this card is currently selected
 * @param onClick Callback function when card is clicked
 */
export const JobCard = ({ job, selected, onClick }: Props) => {
  const daysSincePosted = Math.floor(
    (Date.now() - job.postTS) / (1000 * 60 * 60 * 24)
  );

  return (
    <Paper
      sx={{
        p: 2,
        paddingBottom: 0,
        height: "100%",
        bgcolor: selected ? "action.selected" : "background.paper",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          bgcolor: onClick ? "action.hover" : "background.paper",
        },
      }}
      onClick={onClick}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {job.title}
      </Typography>
      <Typography variant="h5" color="primary" gutterBottom>
        {job.company}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <DisplayChip condition={job.isRemote} label="Remote" />
        <DisplayChip
          condition={daysSincePosted < 30}
          label={daysSincePosted < 7 ? "New" : "Recent"}
        />
      </Stack>

      <IconTypography Icon={MapPin} text={job.location} />
      <IconTypography
        Icon={DollarSign}
        text={job.facets?.salary?.toLocaleString()}
      />
      <IconTypography
        Icon={Briefcase}
        text={job.facets?.experience}
        suffix="years experience"
      />
      <IconTypography
        Icon={Clock}
        prefix="Posted"
        text={daysSincePosted}
        suffix="days ago"
      />

      {job.facets?.summary && (
        <Typography variant="body2" color="text.secondary" marginTop={2}>
          {job.facets.summary}
        </Typography>
      )}
    </Paper>
  );
};
