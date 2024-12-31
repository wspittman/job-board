import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Filters } from "../../services/api";
import { NumberField } from "../NumberField";

const gridSize = { xs: 12, sm: 6, md: 4, lg: 3 };

interface Props extends Filters {
  companyOptions: { id: string; label: string }[];
  onChange: (value: Filters) => void;
}

export const FilterInputs = ({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
  companyOptions,
  onChange,
}: Props) => {
  const companyValue = companyOptions.find((c) => c.id === companyId) ?? null;
  const isRemoteValue =
    isRemote === undefined ? "" : isRemote ? "true" : "false";
  const titleValue = title || "";
  const locationValue = location || "";

  return (
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
          renderInput={(params) => <TextField {...params} label="Company" />}
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">Working from</InputAdornment>
              ),
            },
          }}
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
  );
};
