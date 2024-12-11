import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link, { LinkProps } from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "react-router-dom";
import { FilterLogo } from "../components/FilterLogo";
import { GitHubButton } from "../components/GitHubButton";
import { HeaderMenu } from "./HeaderMenu";

interface HeaderLinkProps {
  url: string;
  text: string;
  variant: LinkProps["variant"];
}

const HeaderLink = ({ url, text, variant }: HeaderLinkProps) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Link
      underline="hover"
      variant={variant}
      color={theme.palette.primary.contrastText}
      onClick={(e) => {
        e.preventDefault();
        navigate(url);
      }}
      sx={{ cursor: "pointer" }}
    >
      {text}
    </Link>
  );
};

export const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <IconButton onClick={() => navigate("/")}>
          <FilterLogo
            size={32}
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              marginRight: 8,
            }}
          />
        </IconButton>
        <HeaderLink url="/" text="Better Job Board" variant="h4" />
        <Box flexGrow={1} />
        <Box
          gap={2}
          alignItems="center"
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <HeaderLink url="/explore" text="Explore" variant="h5" />
          <HeaderLink url="/faq" text="FAQ" variant="h5" />
          <GitHubButton
            size="small"
            edge="start"
            sx={{
              backgroundColor: "primary.light",
              "&:hover": {
                backgroundColor: "primary",
              },
            }}
          />
        </Box>
        <HeaderMenu />
      </Toolbar>
    </AppBar>
  );
};
