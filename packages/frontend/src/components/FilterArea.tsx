import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Filters } from "../services/api";
import {
  useCompanyFilter,
  useIsRemoteFilter,
  useLocationFilter,
  usePostSinceFilter,
  useTitleFilter,
} from "./filterHooks";

const gridSize = { xs: 12, sm: 6, md: 4, lg: 3 };

interface Props {
  filters: Filters;
  onChange: (value: Filters) => void;
}

export const FilterArea = ({ filters, onChange }: Props) => {
  const { companyOptions, companyValue } = useCompanyFilter(filters);
  const isRemoteValue = useIsRemoteFilter(filters);
  const titleValue = useTitleFilter(filters);
  const locationValue = useLocationFilter(filters);
  const postSinceValue = usePostSinceFilter(filters);

  return (
    <Grid container spacing={2} sx={{ m: 1 }}>
      <Grid size={gridSize}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={titleValue}
          onChange={(e) => onChange({ ...filters, title: e.target.value })}
        />
      </Grid>
      <Grid size={gridSize}>
        <Autocomplete
          disablePortal
          options={companyOptions}
          renderInput={(params) => <TextField {...params} label="Company" />}
          value={companyValue}
          onChange={(_, value) =>
            onChange({ ...filters, companyId: value?.id })
          }
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
            onChange({ ...filters, isRemote });
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
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
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
              ...filters,
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
  );
};
