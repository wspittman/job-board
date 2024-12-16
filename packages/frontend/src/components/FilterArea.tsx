import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChevronsDown, X } from "lucide-react";
import { useMemo } from "react";
import { Filters } from "../services/api";
import { useMetadata } from "../services/apiHooks";
import { NumberField } from "./NumberField";

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
              handleHomeEndKeys={false}
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
            <NumberField
              value={minSalary}
              onChange={(minSalary) => onChange({ minSalary })}
              label="Minimum Salary"
              prefix="$"
              max={10000000}
            />
          </Grid>
          <Grid size={gridSize}>
            <NumberField
              value={maxExperience}
              onChange={(maxExperience) => onChange({ maxExperience })}
              label="Required Experience"
              prefix="I have at least"
              suffix="years experience"
              max={100}
            />
          </Grid>
          <Grid size={gridSize}>
            <NumberField
              value={daysSince}
              onChange={(daysSince) => onChange({ daysSince })}
              label="Posted Since"
              suffix="days ago"
              min={1}
              max={365}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
