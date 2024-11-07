import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

export const StatCard = ({ icon: Icon, value, label }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <Icon size={40} color={theme.palette.primary.main} />
      <Typography variant="h4">{value.toLocaleString()}</Typography>
      <Typography variant="h6" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
};
