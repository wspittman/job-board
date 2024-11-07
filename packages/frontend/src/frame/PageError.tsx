import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

export const PageError = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="20vh"
    >
      <Alert severity="error">
        Well that's not better! Unable to load job data. Please try again later.
      </Alert>
    </Box>
  );
};
