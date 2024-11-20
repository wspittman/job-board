import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChevronsDown, X } from "lucide-react";
import { useMemo } from "react";
import { Filters } from "../services/api";
import { useMetadata } from "../services/apiHooks";

const gridSize = { xs: 12, sm: 6, md: 4, lg: 3 };

interface Props extends Filters {
  onChange: (value: Filters) => void;
}

export const FilterArea = ({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
  onChange,
}: Props) => {
  const { data: metadata } = useMetadata();

  const companyOptions = useMemo(() => {
    const companyNames = metadata?.companyNames || [];
    return companyNames
      .map(([id, name]) => ({ id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [metadata]);

  const companyValue = companyOptions.find((c) => c.id === companyId) ?? null;
  const isRemoteValue =
    isRemote === undefined ? "" : isRemote ? "true" : "false";
  const titleValue = title || "";
  const locationValue = location || "";
  const postSinceValue = daysSince || 0;
  const experienceValue = maxExperience || 0;
  const salaryValue = minSalary || 0;

  const chipStrings = useMemo(() => {
    return Object.entries({
      title: title ? `Title: ${title}` : null,
      companyId: companyId ? `Company: ${companyValue?.label}` : null,
      isRemote:
        isRemote !== undefined
          ? isRemote
            ? "Remote"
            : "In-Person/Hybrid"
          : null,
      location: location ? `Location: ${location}` : null,
      daysSince: daysSince
        ? `Posted: At most ${daysSince.toLocaleString()} days ago`
        : null,
      maxExperience:
        maxExperience != null
          ? `Experience: I have ${maxExperience} years`
          : null,
      minSalary: minSalary
        ? `Salary: At least $${minSalary.toLocaleString()}`
        : null,
    }).filter(([, value]) => !!value);
  }, [
    title,
    companyId,
    isRemote,
    location,
    daysSince,
    companyValue,
    maxExperience,
    minSalary,
  ]);

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ChevronsDown />}
        aria-controls="filter-content"
        id="filter-header"
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Filters
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {chipStrings.map(([key, value]) => (
              <Chip
                key={key}
                label={value}
                size="small"
                onDelete={() => onChange({ [key]: undefined })}
                deleteIcon={<X size="18" color="white" />}
              />
            ))}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={gridSize}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={titleValue}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </Grid>
          <Grid size={gridSize}>
            <Autocomplete
              disablePortal
              options={companyOptions}
              renderInput={(params) => (
                <TextField {...params} label="Company" />
              )}
              value={companyValue}
              onChange={(_, value) => onChange({ companyId: value?.id })}
            />
          </Grid>
          <Grid size={gridSize}>
            <TextField
              select
              fullWidth
              label="Remote"
              name="isRemote"
              value={isRemoteValue}
              onChange={(e) => {
                const isRemote =
                  e.target.value === "" ? undefined : e.target.value === "true";
                onChange({ isRemote });
              }}
            >
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="true">Remote</MenuItem>
              <MenuItem value="false">In-Person / Hybrid</MenuItem>
            </TextField>
          </Grid>
          <Grid size={gridSize}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={locationValue}
              onChange={(e) => onChange({ location: e.target.value })}
            />
          </Grid>
          <Grid size={gridSize}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Salary"
              name="salary"
              value={salaryValue}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onChange({
                  minSalary: isNaN(val) || val < 0 ? undefined : val,
                });
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={gridSize}>
            <TextField
              fullWidth
              type="number"
              label="Required Experience"
              name="experience"
              value={experienceValue}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onChange({
                  maxExperience: isNaN(val) || val < 0 ? undefined : val,
                });
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      I have at least
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      years experience
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={gridSize}>
            <TextField
              fullWidth
              type="number"
              label="Posted Since"
              name="postSince"
              value={postSinceValue}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onChange({
                  daysSince: isNaN(val) || val < 1 ? undefined : val,
                });
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">days ago</InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
