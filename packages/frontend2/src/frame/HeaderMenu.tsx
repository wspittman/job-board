import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { GitHubButton } from "../components/GitHubButton";

export const HeaderMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

  const menuClick = (url: string) => {
    navigate(url);
    setAnchorEl(undefined);
  };

  return (
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
        <MenuItem onClick={() => menuClick("/faq")}>FAQ</MenuItem>
        <MenuItem>
          <GitHubButton size="small" edge="start" />
        </MenuItem>
      </Menu>
    </Box>
  );
};
