import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import { ChevronsDown } from "lucide-react";
import { useCompanyOptions } from "../../hooks/filterHooks";
import { Filters } from "../../services/api";
import { FilterHeader } from "./FilterHeader";
import { FilterInputs } from "./FilterInputs";

interface Props {
  filters: Filters;
  onChange: (value: Filters) => void;
}

export const FilterAccordion = ({ filters, onChange }: Props) => {
  const companyOptions = useCompanyOptions();

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ChevronsDown />}
        aria-controls="filter-content"
        id="filter-header"
      >
        <FilterHeader
          {...filters}
          companyOptions={companyOptions}
          onRemove={(key) => onChange({ [key]: undefined })}
        />
      </AccordionSummary>
      <AccordionDetails>
        <FilterInputs
          {...filters}
          companyOptions={companyOptions}
          onChange={onChange}
        />
      </AccordionDetails>
    </Accordion>
  );
};
