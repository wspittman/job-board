import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import React, { useState } from "react";
import { Job } from "../services/api";

type ColKey = Partial<keyof Job>;

const columns: [ColKey, string][] = [
  ["title", "Title"],
  ["company", "Company"],
  ["location", "Location"],
  ["isRemote", "Remote"],
  ["postDate", "Post Date"],
];

interface Props {
  jobs: Job[];
  onSelect: (selected: Job) => void;
}

export const JobTable = ({ jobs, onSelect }: Props) => {
  const [orderBy, setOrderBy] = useState<ColKey>("title");
  const [orderAsc, setOrderAsc] = useState<boolean>(true);
  const [selected, setSelected] = useState<string>();

  const handleSort = (key: ColKey) => {
    setOrderAsc(orderBy !== key || !orderAsc);
    setOrderBy(key);
  };

  const handleSelect = (job: Job) => {
    setSelected(job.id);
    onSelect(job);
  };

  const sortedJobs = React.useMemo(() => {
    const comparator = (a: Job, b: Job) => {
      if (b[orderBy] < a[orderBy]) return orderAsc ? 1 : -1;
      if (b[orderBy] > a[orderBy]) return orderAsc ? -1 : 1;
      return 0;
    };

    return [...jobs].sort(comparator);
  }, [jobs, orderAsc, orderBy]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(([key, label]) => (
              <TableCell key={key}>
                <TableSortLabel
                  active={orderBy === key}
                  direction={orderBy === key && !orderAsc ? "desc" : "asc"}
                  onClick={() => handleSort(key)}
                >
                  {label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedJobs.map((job) => {
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
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>{job.isRemote ? "Yes" : "No"}</TableCell>
                <TableCell>{job.postDate}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};