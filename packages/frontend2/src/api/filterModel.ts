import type { FilterModelApi } from "./apiTypes";

export type FilterModelKey = keyof FilterModelApi;

export class FilterModel {
  readonly #filters: FilterModelApi = {};

  static fromFormData(formData: FormData): FilterModel {
    const model = new FilterModel();
    model.#fromFormData(formData);
    return model;
  }

  isEmpty(): boolean {
    return Object.values(this.#filters).every(isEmpty);
  }

  toUrlSearchParams(): URLSearchParams {
    const entries = this.#asEntries();
    const params = new URLSearchParams();

    for (const [key, value] of entries) {
      params.append(key, String(value));
    }

    return params;
  }

  toFriendlyStrings(): [FilterModelKey, string][] {
    const entries = this.#asEntries();

    return entries.map(([key, value]) => {
      switch (key) {
        case "companyId":
          return [key, `Company: ${value}`];
        case "isRemote":
          return [key, value ? "Remote" : "In-Person / Hybrid"];
        case "title":
          return [key, `Title: ${value}`];
        case "location":
          return [key, `Location: ${value}`];
        case "daysSince":
          return [key, `Posted: Within ${String(value).toLocaleString()} days`];
        case "maxExperience":
          return [key, `Experience: I have ${value} years`];
        case "minSalary":
          return [key, `Salary: At least $${String(value).toLocaleString()}`];
        default:
          return [key, `${key}: ${value}`];
      }
    });
  }

  #fromFormData(formData: FormData): void {
    const getFDValue = (key: string) =>
      formData.get(key)?.toString() ?? undefined;

    this.#filters.companyId = normString(getFDValue("companyId"));
    this.#filters.isRemote = normBoolean(getFDValue("isRemote"));
    this.#filters.title = normString(getFDValue("title"));
    this.#filters.location = normString(getFDValue("location"));
    this.#filters.daysSince = normNumber(getFDValue("daysSince"));
    this.#filters.maxExperience = normNumber(getFDValue("maxExperience"));
    this.#filters.minSalary = normNumber(getFDValue("minSalary"));
  }

  #asEntries(): [FilterModelKey, unknown][] {
    return Object.entries(this.#filters).filter(([, v]) => !isEmpty(v)) as [
      FilterModelKey,
      unknown
    ][];
  }
}

const isEmpty = (v: unknown) => v == undefined || v === "";

const normString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) || trimmed.length < 3 ? undefined : trimmed;
};

const normNumber = (value?: string): number | undefined => {
  const trimmed = value?.trim();
  if (isEmpty(trimmed)) return undefined;
  const num = Number.parseInt(trimmed, 10);
  return Number.isNaN(num) || num < 0 ? undefined : num;
};

const normBoolean = (value?: string): boolean | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) ? undefined : trimmed.toLowerCase() === "true";
};
