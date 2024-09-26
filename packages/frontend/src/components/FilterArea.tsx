import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid2";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useMemo } from "react";
import { Filters } from "../services/api";
import { useMetadata } from "../services/apiHooks";

interface Props {
  filters: Filters;
  onChange: (value: Filters) => void;
}

export const FilterArea = ({ filters, onChange }: Props) => {
  const { data: metadata, isLoading, isError } = useMetadata();

  const companyOptions = useMemo(() => {
    const companyNames = metadata?.companyNames || [];
    return companyNames.map(([id, name]) => ({ id, label: name }));
  }, [metadata]);

  const companyValue = useMemo(() => {
    return companyOptions.find((c) => c.id === filters.companyId) ?? null;
  }, [companyOptions, filters.companyId]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>An error occurred</div>;

  return (
    <Grid container spacing={2} sx={{ m: 1 }}>
      <Grid size="grow">
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
      <Grid size="grow">
        <TextField
          select
          fullWidth
          label="Remote"
          name="isRemote"
          value={filters.isRemote ?? ""}
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
    </Grid>
  );
};
