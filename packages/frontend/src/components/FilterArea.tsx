import Autocomplete from "@mui/material/Autocomplete";
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

  const CompanySelections = useMemo(
    () =>
      metadata?.companyNames.map(([id, name]) => ({ id, label: name })) || [],
    [metadata]
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>An error occurred</div>;

  return (
    <div>
      <Autocomplete
        disablePortal
        options={CompanySelections}
        renderInput={(params) => <TextField {...params} label="Company" />}
        onChange={(_, value) => onChange({ ...filters, companyId: value?.id })}
      />
    </div>
  );
};
