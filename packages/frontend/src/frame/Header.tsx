import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link, { LinkProps } from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";

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
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs = [
    <HeaderLink key="home" url="/" text="Job Board" variant="h5" />,
    ...pathSegments.map((segment, index) => {
      const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const isLast = index === pathSegments.length - 1;

      return isLast ? (
        <Typography variant="h6" color="white" key={url}>
          {segment.charAt(0).toUpperCase() + segment.slice(1)}
        </Typography>
      ) : (
        <HeaderLink
          key={url}
          url={url}
          text={segment.charAt(0).toUpperCase() + segment.slice(1)}
          variant="h6"
        />
      );
    }),
  ];

  return (
    <AppBar position="sticky">
      <Toolbar variant="dense">
        <Breadcrumbs aria-label="breadcrumb">{breadcrumbs}</Breadcrumbs>
        <Box sx={{ flexGrow: 1 }} />
        <HeaderLink url="/about" text="About" variant="h6" />
        <HeaderLink url="/explore" text="Explore" variant="h5" />
      </Toolbar>
    </AppBar>
  );
};
