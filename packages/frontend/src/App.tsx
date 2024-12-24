import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Header } from "./frame/Header";
import { Explore } from "./pages/Explore";
import { FAQ } from "./pages/FAQ";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { theme } from "./theme";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Box
            display="flex"
            flexDirection="column"
            height="100vh"
            margin="-8px"
            bgcolor="background.default"
          >
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Box>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
