import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useMemo, useState } from "react";
import { JobTable } from "../components/JobTable";
import { useJobs, useMetadata } from "../services/apiHooks";

export const Explore = () => {
  const [selectorValue, setSelectorValue] = useState("");

  const {
    data: metadata,
    isLoading: mLoading,
    isError: mError,
  } = useMetadata();
  const { data = [], isLoading, isError } = useJobs(selectorValue);

  const CompanySelections = useMemo(
    () =>
      metadata?.companyNames.map(([id, name]) => ({ id, label: name })) || [],
    [metadata]
  );

  if (mLoading) return <div>Loading...</div>;
  if (mError) return <div>An error occurred</div>;

  return (
    <div>
      <Autocomplete
        disablePortal
        options={CompanySelections}
        renderInput={(params) => <TextField {...params} label="Company" />}
        onChange={(_, value) => setSelectorValue(value?.id || "")}
      />
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}
      <JobTable jobs={data} onSelect={() => {}} />
    </div>
  );
};
