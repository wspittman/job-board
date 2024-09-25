import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Selector } from "../components/Selector";
import { fetchJobs, ping } from "../services/api";

const exampleSelections = [
  { value: "", text: "Pick one" },
  { value: "example1", text: "example1" },
  { value: "example2", text: "example2" },
];

export const Home: React.FC = () => {
  const [selectorValue, setSelectorValue] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ping"],
    queryFn: ping,
    refetchOnMount: false,
  });

  const {
    data: jobsData,
    isLoading: jobsIsLoading,
    isError: jobsIsError,
  } = useQuery({
    queryKey: ["jobs", selectorValue],
    queryFn: () => fetchJobs(selectorValue),
    refetchOnMount: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>An error occurred</div>;

  return (
    <div>
      <h1>Boilerplate</h1>
      <p>{data}</p>
      <Selector
        label="Selector Example"
        tooltip="Selector tooltip example"
        value={selectorValue}
        setValue={setSelectorValue}
        options={exampleSelections}
      />
      {jobsIsLoading && <div>Jobs Loading...</div>}
      {jobsIsError && <div>Jobs Error</div>}
      {jobsData && (
        <div>
          {jobsData.map((job) => (
            <div key={job.id}>
              <h2>{job.title}</h2>
              <p>{job.company}</p>
              <p>{job.isRemote ? "Remote" : "Not Remote"}</p>
              <p>{job.location}</p>
              <p>{job.description}</p>
              <p>{job.postDate}</p>
              <a href={job.applyUrl}>Apply</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
