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
        py: 6,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <Icon size={40} color={theme.palette.primary.main} />
      <Typography variant="h2">{value.toLocaleString()}</Typography>
      <Typography variant="h4" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
};
