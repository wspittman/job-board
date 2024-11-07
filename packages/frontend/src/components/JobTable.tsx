import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import { Check, X } from "lucide-react";
import React, { useState } from "react";
import { PageError } from "../frame/PageError";
import { PageLoader } from "../frame/PageLoader";
import { Filters, Job } from "../services/api";
import { useJobs } from "../services/apiHooks";

interface ColDef<T> {
  name: string;
  getValue: (job: Job) => T;
  getDisplay?: (value: T) => string | React.ReactNode;
}

const columns: ColDef<string | number | boolean>[] = [
  {
    name: "Title",
    getValue: (job) => job.title,
  },
  {
    name: "Company",
    getValue: (job) => job.company,
  },
  {
    name: "Summary",
    getValue: (job) => job.facets?.summary ?? "",
  },
  {
    name: "Remote",
    getValue: (job) => job.isRemote,
    getDisplay: (value) => (value ? <Check /> : <X />),
  },
  {
    name: "Location",
    getValue: (job) => job.location,
  },
  {
    name: "Experience",
    getValue: (job) => job.facets?.experience ?? 0,
    getDisplay: (value) => (value ? `${value} years` : ""),
  },
  {
    name: "Salary",
    getValue: (job) => job.facets?.salary ?? 0,
    getDisplay: (value) => (value ? `$${value}` : ""),
  },
  {
    name: "Posted",
    getValue: (job) => job.postTS,
    getDisplay: (value) => timePassedSince(value as number),
  },
];

type Col = (typeof columns)[number];

interface Props {
  filters: Filters;
  onSelect: (selected: Job) => void;
}

export const JobTable = ({ filters, onSelect }: Props) => {
  const [orderBy, setOrderBy] = useState<Col>(columns[0]);
  const [orderAsc, setOrderAsc] = useState<boolean>(true);
  const [selected, setSelected] = useState<string>();

  const { data: jobs = [], isLoading, isError } = useJobs(filters);

  const handleSort = (column: Col) => {
    setOrderAsc(orderBy !== column || !orderAsc);
    setOrderBy(column);
  };

  const handleSelect = (job: Job) => {
    setSelected(job.id);
    onSelect(job);
  };

  const sortedJobs = React.useMemo(() => {
    const comparator = (a: Job, b: Job) => {
      const aValue = orderBy.getValue(a);
      const bValue = orderBy.getValue(b);
      if (aValue < bValue) return orderAsc ? 1 : -1;
      if (aValue > bValue) return orderAsc ? -1 : 1;
      return 0;
    };

    return [...jobs].sort(comparator);
  }, [jobs, orderAsc, orderBy]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.name}>
                <TableSortLabel
                  active={orderBy === column}
                  direction={orderBy === column && !orderAsc ? "desc" : "asc"}
                  onClick={() => handleSort(column)}
                >
                  {column.name}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <PageLoader />
              </TableCell>
            </TableRow>
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <PageError />
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            !isError &&
            sortedJobs.map((job) => {
              const isSelected = selected === job.id;
              return (
                <TableRow
                  key={job.id}
                  hover
                  onClick={() => handleSelect(job)}
                  role="checkbox"
                  aria-checked={isSelected}
                  selected={isSelected}
                >
                  {columns.map(({ name, getValue, getDisplay }) => (
                    <TableCell key={name}>
                      {getDisplay ? getDisplay(getValue(job)) : getValue(job)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

function timePassedSince(before: number): string {
  const diff = Date.now() - before;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return years === 1 ? "1 year ago" : `${years} years ago`;
  } else if (months > 0) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else if (days > 0) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else {
    return "< 1 day ago";
  }
}
