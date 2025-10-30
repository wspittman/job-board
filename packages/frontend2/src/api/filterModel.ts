import type { FilterModelApi } from "./apiTypes";

export type FilterModelKey = keyof FilterModelApi;

export class FilterModel {
  readonly #filters: FilterModelApi = {};

  static fromFormData(formData: FormData): FilterModel {
    const model = new FilterModel();
    model.#fromFormData(formData);
    return model;
  }

  static fromUrlSearchParams(params: URLSearchParams): FilterModel {
    const model = new FilterModel();
    model.#fromUrlSearchParams(params);
    return model;
  }

  isEmpty(): boolean {
    return Object.values(this.#filters).every(isEmpty);
  }

  toUrlSearchParams(): URLSearchParams {
    const entries = this.toEntries();
    const params = new URLSearchParams();

    for (const [key, value] of entries) {
      params.append(key, String(value));
    }

    return params;
  }

  toFriendlyStrings(): [FilterModelKey, string][] {
    const entries = this.toEntries();

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

  toEntries(): [FilterModelKey, unknown][] {
    return Object.entries(this.#filters).filter(([, v]) => !isEmpty(v)) as [
      FilterModelKey,
      unknown
    ][];
  }

  #fromFormData(formData: FormData): void {
    this.#fromGeneric((key) => formData.get(key)?.toString());
  }

  #fromUrlSearchParams(params: URLSearchParams): void {
    this.#fromGeneric((key) => params.get(key));
  }

  #fromGeneric(get: (key: string) => string | null | undefined): void {
    this.#filters.companyId = normString(get("companyId"));
    this.#filters.isRemote = normBoolean(get("isRemote"));
    this.#filters.title = normString(get("title"));
    this.#filters.location = normString(get("location"));
    this.#filters.daysSince = normNumber(get("daysSince"));
    this.#filters.maxExperience = normNumber(get("maxExperience"));
    this.#filters.minSalary = normNumber(get("minSalary"));
  }
}

const isEmpty = (v: unknown) => v == undefined || v === "";

const normString = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) || trimmed.length < 3 ? undefined : trimmed;
};

const normNumber = (value?: string | null): number | undefined => {
  const trimmed = value?.trim();
  if (isEmpty(trimmed)) return undefined;
  const num = Number.parseInt(trimmed, 10);
  return Number.isNaN(num) || num < 0 ? undefined : num;
};

const normBoolean = (value?: string | null): boolean | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) ? undefined : trimmed.toLowerCase() === "true";
};
