import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import type { ComponentProps, SelectorOption } from "./types";

interface Props extends ComponentProps<string> {
  options: SelectorOption[];
}

export const Selector = ({
  options,
  label,
  value,
  setValue,
  isDisabled,
  tooltip = "",
}: Props): JSX.Element => {
  return (
    <Tooltip placement="left" title={tooltip}>
      <FormControl disabled={isDisabled}>
        <Select
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          {options.map((option) => (
            <MenuItem value={option.value} key={option.value}>
              {option.text}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{label}</FormHelperText>
      </FormControl>
    </Tooltip>
  );
};
