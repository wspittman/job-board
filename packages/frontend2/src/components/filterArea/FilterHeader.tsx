import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { X } from "lucide-react";
import { useMemo } from "react";
import { Filters } from "../../services/api";

interface Props extends Filters {
  companyOptions: { id: string; label: string }[];
  onRemove: (key: string) => void;
}

export const FilterHeader = ({
  companyId,
  isRemote,
  title,
  location,
  daysSince,
  maxExperience,
  minSalary,
  companyOptions,
  onRemove,
}: Props) => {
  const companyValue = companyOptions.find((c) => c.id === companyId) ?? null;

  const chipStrings = useMemo(() => {
    return Object.entries({
      title: title ? `Title: ${title}` : undefined,
      companyId: companyId ? `Company: ${companyValue?.label}` : undefined,
      isRemote:
        isRemote !== undefined
          ? isRemote
            ? "Remote"
            : "In-Person/Hybrid"
          : undefined,
      location: location ? `Location: ${location}` : undefined,
      daysSince: daysSince
        ? `Posted: At most ${daysSince.toLocaleString()} days ago`
        : undefined,
      maxExperience:
        maxExperience != null
          ? `Experience: I have ${maxExperience} years`
          : undefined,
      minSalary: minSalary
        ? `Salary: At least $${minSalary.toLocaleString()}`
        : undefined,
    }).filter(([, value]) => !!value);
  }, [
    title,
    companyId,
    isRemote,
    location,
    daysSince,
    companyValue,
    maxExperience,
    minSalary,
  ]);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="h4" fontWeight="bold" color="primary.main">
        Filters
      </Typography>
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {chipStrings.map(([key, value]) => (
          <Chip
            key={key}
            label={value}
            size="small"
            onDelete={() => onRemove(key)}
            deleteIcon={<X size="18" color="white" />}
          />
        ))}
      </Box>
    </Box>
  );
};
