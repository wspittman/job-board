import { Paper } from "@mui/material";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Briefcase, Clock, DollarSign, MapPin } from "lucide-react";
import { ElementType } from "react";
import { Job } from "../services/api";

interface Props {
  job: Job;
  selected?: boolean;
  onClick?: () => void;
}

interface DisplayFacetProps {
  Icon: ElementType;
  text?: string | number;
  suffix?: string;
}

/**
 * Renders a single facet of job information with an icon
 * @param Icon The icon component to display
 * @param text The text content to display
 * @param suffix Optional suffix to append to the text
 */
const DisplayFacet = ({ Icon, text, suffix }: DisplayFacetProps) => {
  if (!text) return null;

  return (
    <Box display="flex" alignItems="center">
      <Icon size={16} />
      <Typography variant="body2" marginLeft={1}>
        {`${text} ${suffix ?? ""}`}
      </Typography>
    </Box>
  );
};

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
        cursor: "pointer",
        "&:hover": {
          bgcolor: "action.hover",
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

      <DisplayFacet Icon={MapPin} text={job.location} />
      <DisplayFacet
        Icon={DollarSign}
        text={job.facets?.salary?.toLocaleString()}
      />
      <DisplayFacet
        Icon={Briefcase}
        text={job.facets?.experience}
        suffix="years experience"
      />
      <DisplayFacet Icon={Clock} text={`Posted ${daysSincePosted} days ago`} />

      {job.facets?.summary && (
        <Typography variant="body2" color="text.secondary" marginTop={2}>
          {job.facets.summary}
        </Typography>
      )}
    </Paper>
  );
};
