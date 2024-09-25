import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ping } from "../services/api";

export const Home: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ping"],
    queryFn: ping,
    refetchOnMount: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>An error occurred</div>;

  return (
    <div>
      <h1>Boilerplate</h1>
      <p>{data}</p>
    </div>
  );
};
