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
  return Object.entries<string>(obj)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
