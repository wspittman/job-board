import { usePing } from "../services/apiHooks";

export const Home = () => {
  const { data, isLoading, isError } = usePing();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>An error occurred</div>;

  return (
    <div>
      <h1>Boilerplate</h1>
      <p>{JSON.stringify(data)}</p>
    </div>
  );
};
