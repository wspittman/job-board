import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link, { LinkProps } from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterLogo } from "../components/FilterLogo";

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

export const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

  const menuClick = (url: string) => {
    navigate(url);
    setAnchorEl(undefined);
  };

  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <FilterLogo
          size={32}
          style={{ backgroundColor: "white", borderRadius: 8, marginRight: 8 }}
        />
        <HeaderLink url="/" text="Better Job Board" variant="h4" />
        <Box flexGrow={1} />
        <Box gap={2} sx={{ display: { xs: "none", sm: "flex" } }}>
          <HeaderLink url="/explore" text="Explore" variant="h5" />
          <HeaderLink url="/about" text="About" variant="h5" />
        </Box>
        <Box sx={{ display: { xs: "flex", sm: "none" } }}>
          <IconButton
            edge="end"
            color="inherit"
            onClick={(event) => setAnchorEl(event.currentTarget)}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(undefined)}
          >
            <MenuItem onClick={() => menuClick("/explore")}>Explore</MenuItem>
            <MenuItem onClick={() => menuClick("/about")}>About</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
