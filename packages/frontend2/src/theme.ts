import "@fontsource-variable/inter";
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#6036c6",
    },
    secondary: {
      main: "#3672c6",
    },
    background: {
      default: "#fafafa",
    },
  },
  typography: {
    fontFamily: '"Inter Variable", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "3rem",
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "2rem",
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "1.5rem",
      lineHeight: 1.2,
    },
    h5: {
      fontSize: "1rem",
      lineHeight: 1.2,
    },
    button: {
      // Prevents all-caps buttons
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        filled: ({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          "&:hover": {
            backgroundColor: theme.palette.secondary.dark,
          },
        }),
      },
    },
  },
});
