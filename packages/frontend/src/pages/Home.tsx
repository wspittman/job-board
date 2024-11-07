import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Briefcase, Building2 } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { useMetadata } from "../services/apiHooks";

const gridSize = { xs: 12, sm: 6 };

export const Home = () => {
  const { data, isLoading, isError } = useMetadata();

  return (
    <Container maxWidth="lg">
      <Typography
        variant="h3"
        component="h1"
        fontWeight="bold"
        color="primary.main"
        align="center"
        gutterBottom
        marginTop={8}
      >
        Stop scrolling. Start finding.
      </Typography>
      <Typography
        variant="h5"
        color="text.secondary"
        align="center"
        gutterBottom
      >
        The better job board with smarter search – no account needed.
      </Typography>

      {isLoading && <PageLoader />}
      {isError && <PageError />}

      {!isLoading && !isError && data && (
        <>
          <Paper
            elevation={3}
            sx={{
              maxWidth: "md",
              p: 4,
              my: 6,
              mx: "auto",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for jobs..."
              disabled
            />
          </Paper>
          <Grid
            container
            spacing={4}
            sx={{
              maxWidth: "md",
              mx: "auto",
            }}
          >
            <Grid size={gridSize}>
              <StatCard
                icon={Briefcase}
                value={data.jobCount}
                label="Available Jobs"
              />
            </Grid>
            <Grid size={gridSize}>
              <StatCard
                icon={Building2}
                value={data.companyCount}
                label="Companies Hiring"
              />
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};
