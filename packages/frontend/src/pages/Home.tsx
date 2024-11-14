import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Briefcase, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/StatCard";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { useMetadata } from "../services/apiHooks";

const gridSize = { xs: 12, sm: 6 };

const exampleSearches = [
  {
    label: "Internships",
    query: "title=intern",
  },
  {
    label: "Remote Staff Software Engineer",
    query: "isRemote=true&title=Staff+Software+Engineer",
  },
  {
    label: "Data Analyst in Seattle",
    query: "isRemote=false&title=Data+Analyst&location=Seattle",
  },
  {
    label: "6-figure remote roles posted this week",
    query: "isRemote=true&daysSince=7&minSalary=100000",
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMetadata();

  return (
    <Container maxWidth="lg">
      <Typography
        variant="h1"
        fontWeight="bold"
        color="primary"
        align="center"
        gutterBottom
        marginTop={8}
      >
        Stop scrolling. Start finding.
      </Typography>
      <Typography
        variant="h4"
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
              textAlign: "center",
              p: 4,
              my: 6,
              mx: "auto",
            }}
          >
            <Typography variant="h4" color="text.secondary" gutterBottom>
              Start from an example search
            </Typography>
            <Box
              display="flex"
              gap={1}
              justifyContent="center"
              flexWrap="wrap"
              mb={4}
            >
              {exampleSearches.map(({ label, query }) => (
                <Chip
                  key={query}
                  label={label}
                  onClick={() => navigate(`/explore?${query}`)}
                  clickable
                />
              ))}
            </Box>
            <Typography variant="h4" color="text.secondary" gutterBottom>
              Or start from scratch
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/explore")}
            >
              Explore
            </Button>
          </Paper>
          <Grid container spacing={4} maxWidth="md" marginX="auto">
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
