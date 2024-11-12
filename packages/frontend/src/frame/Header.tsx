import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Link, { LinkProps } from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "react-router-dom";

interface HeaderLinkProps {
  url: string;
  text: string;
  variant: LinkProps["variant"];
}

const HeaderLink = ({ url, text, variant }: HeaderLinkProps) => {
  const navigate = useNavigate();

  return (
    <Link
      underline="hover"
      variant={variant}
      color="white"
      onClick={(e) => {
        e.preventDefault();
        navigate(url);
      }}
      sx={{ cursor: "pointer", mx: 1 }}
    >
      {text}
    </Link>
  );
};

export const Header = (): JSX.Element => {
  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <HeaderLink url="/" text="Better Job Board" variant="h4" />
        <Box sx={{ flexGrow: 1 }} />
        <HeaderLink url="/about" text="About" variant="h5" />
        <HeaderLink url="/explore" text="Explore" variant="h5" />
      </Toolbar>
    </AppBar>
  );
};
