import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { useCompanyOptions } from "../../hooks/filterHooks";
import { Filters } from "../../services/api";
import { FilterHeader } from "./FilterHeader";
import { FilterInputs } from "./FilterInputs";

interface Props {
  isOpen: boolean;
  filters: Filters;
  onClose: () => void;
  onChange: (value: Filters) => void;
}

export const FilterDrawer = ({ isOpen, filters, onClose, onChange }: Props) => {
  const companyOptions = useCompanyOptions();

  return (
    <Drawer open={isOpen} onClose={onClose} sx={{ display: { md: "none" } }}>
      <Button onClick={onClose} sx={{ m: 1 }} variant="outlined">
        Close
      </Button>
      <Box p={2}>
        <FilterHeader
          {...filters}
          companyOptions={companyOptions}
          onRemove={(key) => onChange({ [key]: undefined })}
        />
      </Box>
      <Box px={2}>
        <FilterInputs
          {...filters}
          companyOptions={companyOptions}
          onChange={onChange}
        />
      </Box>
    </Drawer>
  );
};
