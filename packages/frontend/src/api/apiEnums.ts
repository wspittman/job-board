import { fmt } from "../utils/format";

// #region Helper Functions

type Enum<T extends string> = Record<T, string>;

function asEnum<T extends string>(obj: Enum<T>, value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  const val = value.trim() as T;
  if (obj[val]) return val;
  const lower = val.toLowerCase() as T;
  if (obj[lower]) return lower;
  const upper = val.toUpperCase() as T;
  return obj[upper] ? upper : undefined;
}

function asLabel<T extends string>(obj: Enum<T>, value: unknown): string {
  const val = asEnum(obj, value);
  return val ? obj[val] : "";
}

function toOptions<T extends string>(obj: Enum<T>) {
  return fmt.sortedOptions(Object.entries(obj));
}

// #endregion

export type Presence = "onsite" | "remote" | "hybrid";

const workTimeBasis = {
  full_time: "Full-time",
  part_time: "Part-time",
} as const;

export type WorkTimeBasis = keyof typeof workTimeBasis;
export const workTimeBasisOptions = toOptions(workTimeBasis);
export const toWorkTimeBasis = (value: unknown) => asEnum(workTimeBasis, value);
export const toWorkTimeBasisLabel = (value: unknown) =>
  asLabel(workTimeBasis, value);

const jobFamily = {
  engineering: "Engineering",
  design: "Design",
  product: "Product",
  data: "Data",
  it: "IT",
  security: "Security",
  marketing: "Marketing",
  sales: "Sales",
  customer_success: "Customer Success",
  ops: "Operations",
  finance: "Finance",
  hr: "Human Resources",
  legal: "Legal",
  healthcare: "Healthcare",
} as const;

export type JobFamily = keyof typeof jobFamily;
export const jobFamilyOptions = toOptions(jobFamily);
export const toJobFamily = (value: unknown): JobFamily | undefined =>
  asEnum(jobFamily, value);
export const toJobFamilyLabel = (value: unknown): string =>
  asLabel(jobFamily, value);

const companyStage = {
  bootstrapped: "Bootstrapped",
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
  series_d_plus: "Series D+",
  private_equity: "Private Equity",
  public: "Public",
  nonprofit: "Nonprofit",
} as const;

export type CompanyStage = keyof typeof companyStage;
export const companyStageOptions = toOptions(companyStage);
export const toCompanyStage = (value: unknown): CompanyStage | undefined =>
  asEnum(companyStage, value);
export const toCompanyStageLabel = (value: unknown): string =>
  asLabel(companyStage, value);

const payCadence = {
  hourly: "Hour",
  salary: "Year",
  stipend: "Stipend",
} as const;

export type PayCadence = keyof typeof payCadence;
export const payCadenceOptions = toOptions(payCadence);
export const toPayCadence = (value: unknown): PayCadence | undefined =>
  asEnum(payCadence, value);
export const toPayCadenceLabel = (value: unknown): string =>
  asLabel(payCadence, value);

const jobOrderBy = {
  post_time: "Post Time",
  highest_salary: "Pay Rate",
  lowest_experience: "Required Experience",
} as const;

export type JobOrderBy = keyof typeof jobOrderBy;
export const jobOrderByOptions = toOptions(jobOrderBy);
export const toJobOrderBy = (value: unknown): JobOrderBy | undefined =>
  asEnum(jobOrderBy, value);
export const toJobOrderByLabel = (value: unknown): string =>
  asLabel(jobOrderBy, value);

const usState = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  AS: "American Samoa",
  GU: "Guam",
  MP: "Northern Mariana Islands",
  PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
} as const;

export type UsState = keyof typeof usState;
export const stateOptions = toOptions(usState);
export const toUsState = (value: unknown): UsState | undefined =>
  asEnum(usState, value);
export const toUsStateLabel = (value: unknown): string =>
  asLabel(usState, value);
