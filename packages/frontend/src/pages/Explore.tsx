import { useMemo, useState } from "react";
import { JobTable } from "../components/JobTable";
import { Selector } from "../components/Selector";
import { useJobs, useMetadata } from "../services/apiHooks";

export const Explore = () => {
  const [selectorValue, setSelectorValue] = useState("");

  const {
    data: metadata,
    isLoading: mLoading,
    isError: mError,
  } = useMetadata();
  const { data = [], isLoading, isError } = useJobs(selectorValue);

  const companySelections = useMemo(
    () =>
      metadata?.companyNames.map(([id, name]) => ({ value: id, text: name })) ||
      [],
    [metadata]
  );

  if (mLoading) return <div>Loading...</div>;
  if (mError) return <div>An error occurred</div>;

  return (
    <div>
      <Selector
        label="Selector Example"
        tooltip="Selector tooltip example"
        value={selectorValue}
        setValue={setSelectorValue}
        options={companySelections}
      />
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}
      <JobTable jobs={data} onSelect={() => {}} />
    </div>
  );
};
