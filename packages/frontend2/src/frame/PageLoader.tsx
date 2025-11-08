import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

export const PageLoader = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="20vh"
    >
      <CircularProgress />
    </Box>
  );
};
