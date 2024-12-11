import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { Filters } from "../services/api";

interface Props extends Filters {
  value?: number;
  onChange: (value?: number) => void;
  label: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
}

export const NumberField = ({
  value,
  onChange,
  label,
  prefix,
  suffix,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
}: Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    if (input === "") {
      onChange(undefined);
    } else if (/^\d+$/.test(input)) {
      const newValue = parseInt(input, 10);
      if (!isNaN(newValue) && newValue >= min && newValue <= max) {
        onChange(newValue);
      }
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={value ?? ""}
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment: prefix ? (
            <InputAdornment position="start">{prefix}</InputAdornment>
          ) : null,
          endAdornment: suffix ? (
            <InputAdornment position="end">{suffix}</InputAdornment>
          ) : null,
        },
      }}
    />
  );
};
