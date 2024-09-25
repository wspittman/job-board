import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { JobTable } from "../components/JobTable";
import { Selector } from "../components/Selector";
import { fetchJobs } from "../services/api";

const exampleSelections = [
  { value: "", text: "Pick one" },
  { value: "example1", text: "example1" },
  { value: "example2", text: "example2" },
];

export const Explore = () => {
  const [selectorValue, setSelectorValue] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", selectorValue],
    queryFn: () => fetchJobs(selectorValue),
    refetchOnMount: false,
  });

  return (
    <div>
      <Selector
        label="Selector Example"
        tooltip="Selector tooltip example"
        value={selectorValue}
        setValue={setSelectorValue}
        options={exampleSelections}
      />
      {isLoading && <div>Loading...</div>}
      {isError && <div>An error occurred</div>}
      {data && <JobTable jobs={data} onSelect={() => {}} />}
    </div>
  );
};
