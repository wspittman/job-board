import { fmt } from "../utils/format";

// #region Helper Functions

type Enum<T extends string> = Record<T, string>;

function asEnum<T extends string>(obj: Enum<T>, value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  const val = value.trim() as T;
  return obj[val] ? val : undefined;
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
