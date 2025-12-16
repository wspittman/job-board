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
  return Object.entries<string>(obj)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const currencyDisplayNames = new Intl.DisplayNames(undefined, {
  type: "currency",
});

function toCurrencyName(code: string): string {
  try {
    const displayName = currencyDisplayNames.of(code);
    if (displayName && displayName !== code) {
      return `${code}: ${displayName}`;
    }
  } catch {
    /* Ignored */
  }
  return code;
}

// #endregion

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

const payCadence = {
  hourly: "Hour",
  salary: "Annual",
  stipend: "Stipend",
} as const;

export type PayCadence = keyof typeof payCadence;
export const payCadenceOptions = toOptions(payCadence);
export const toPayCadence = (value: unknown): PayCadence | undefined =>
  asEnum(payCadence, value);
export const toPayCadenceLabel = (value: unknown): string =>
  asLabel(payCadence, value);

/*
The set of "known" codes present in the data (12/15/25).
- We could choose to use all values in Intl.supportedValuesOf("currency")
  - But that would include many entries in the Filter UX that we have no data for
- Types not in this list MAY be present in the data
  - They SHOULD NOT be displayed in the filter input or be filterable
  - They SHOULD be displayed in code-only form in the job details
- currency_top are the most common currencies in the data, to appear first in UX
- currency_other are other known currencies in the data, sorted alphabetically in UX
*/
const currency_top = {
  USD: toCurrencyName("USD"),
  CAD: toCurrencyName("CAD"), // 255
  EUR: toCurrencyName("EUR"), // 106
  GBP: toCurrencyName("GBP"), // 97
} as const;
const currency_other = {
  AUD: toCurrencyName("AUD"),
  ARS: toCurrencyName("ARS"),
  AED: toCurrencyName("AED"),
  BRL: toCurrencyName("BRL"),
  CRC: toCurrencyName("CRC"),
  INR: toCurrencyName("INR"),
  JPY: toCurrencyName("JPY"),
  KRW: toCurrencyName("KRW"),
  MXN: toCurrencyName("MXN"),
  PHP: toCurrencyName("PHP"),
  PLN: toCurrencyName("PLN"),
  SEK: toCurrencyName("SEK"),
  SGD: toCurrencyName("SGD"),
  TWD: toCurrencyName("TWD"),
} as const;
const currency = {
  ...currency_top,
  ...currency_other,
} as const;
export type Currency = keyof typeof currency;
export const currencyOptions = [
  ...Object.entries<string>(currency_top).map(([value, label]) => ({
    value,
    label,
  })),
  ...toOptions(currency_other),
];
export const toCurrency = (value: unknown): Currency | undefined =>
  asEnum(currency, value);
export const toCurrencyLabel = (value: unknown): string =>
  // Unlike other enums, fall back to the code itself if unknown
  asLabel(currency, value) || (typeof value === "string" ? value : "");
