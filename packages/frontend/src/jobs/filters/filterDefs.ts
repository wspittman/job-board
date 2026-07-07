import {
  companyStageOptions,
  jobFamilyOptions,
  jobOrderByOptions,
  payCadenceOptions,
  stateOptions,
  workTimeBasisOptions,
} from "../../api/apiEnums";
import type { FilterModelKey } from "../../api/filterModel";
import type { FormElementProps } from "../../components/form-element";

export interface FilterFieldDef extends FormElementProps {
  type: "jb-form-input" | "jb-form-select" | "jb-form-combobox";
  name: FilterModelKey;
}

export type FilterGroupDef = readonly [string, readonly FilterFieldDef[]];

export const companyFilterDef = {
  type: "jb-form-combobox",
  name: "companyId",
  label: "Company",
} as const satisfies FilterFieldDef;

export const filterDefs = [
  [
    "The Work",
    [
      {
        type: "jb-form-input",
        name: "title",
        label: "Title",
        maxLength: 100,
        tooltip:
          "A partial match search on job title text, so 'port' will match 'Support Engineer' and 'Portfolio Manager'.",
      },
      companyFilterDef,
      {
        type: "jb-form-select",
        name: "companyStage",
        label: "Company Stage",
        options: companyStageOptions,
      },
      {
        type: "jb-form-select",
        name: "workTimeBasis",
        label: "Hours",
        options: workTimeBasisOptions,
      },
      {
        type: "jb-form-select",
        name: "jobFamily",
        label: "Job Family",
        tooltip:
          "A broad categorization of the job's primary function. Some jobs can be difficult to categorize, so leave this empty if your target role spans multiple functions.",
        options: jobFamilyOptions,
      },
    ],
  ],
  [
    "The Compensation",
    [
      {
        type: "jb-form-select",
        name: "payCadence",
        label: "Pay Interval",
        options: payCadenceOptions,
      },
      {
        type: "jb-form-input",
        name: "minSalary",
        label: "Minimum Rate",
        tooltip: "For best results, set alongside Pay Interval.",
        prefix: "$",
        validation: {
          type: "int",
          min: 0,
          max: 9_999_999,
        },
      },
    ],
  ],
  [
    "Other",
    [
      {
        type: "jb-form-select",
        name: "isRemote",
        label: "Remote",
        options: [
          { label: "Remote", value: "true" },
          { label: "In-Person / Hybrid", value: "false" },
        ],
      },
      {
        type: "jb-form-input",
        name: "city",
        label: "City",
        prefix: "Working from",
        maxLength: 100,
      },
      {
        type: "jb-form-select",
        name: "state",
        label: "State / Territory",
        options: stateOptions,
      },
      {
        type: "jb-form-input",
        name: "maxExperience",
        label: "Required Experience",
        prefix: "I have",
        suffix: "years experience",
        validation: {
          type: "int",
          min: 0,
          max: 99,
        },
      },
      {
        type: "jb-form-input",
        name: "daysSince",
        label: "Posted Since",
        tooltip:
          "Jobs posted within the specified number of days. Some sources only provide last updated date, so we use the earliest date we've seen.",
        prefix: "Posted within",
        suffix: "days ago",
        validation: {
          type: "int",
          min: 1,
          max: 99,
        },
      },
      {
        // Hidden via CSS
        type: "jb-form-input",
        name: "jobId",
        label: "Job ID",
      },
    ],
  ],
  [
    "Results",
    [
      {
        type: "jb-form-select",
        name: "orderBy",
        label: "Order By",
        tooltip:
          "After filters narrow the results, this determines the sort. Required Experience puts jobs with no listed requirement first.",
        options: jobOrderByOptions,
      },
    ],
  ],
] as const satisfies readonly FilterGroupDef[];
