import type { FilterModel } from "./apiTypes";

const isEmpty = (v: unknown) => v === undefined || v === "";

export function formDataToFilterModel(formData: FormData): FilterModel {
  const toString = (key: string) =>
    formData.get(key)?.toString().trim() || undefined;
  const toNumber = (key: string) => {
    const val = toString(key);
    if (!val) return undefined;
    const num = Number.parseInt(val, 10);
    return Number.isNaN(num) ? undefined : num;
  };

  const filters: FilterModel = {
    title: toString("title"),
    location: toString("location"),
    minSalary: toNumber("minSalary"),
    maxExperience: toNumber("maxExperience"),
    daysSince: toNumber("daysSince"),
  };

  return filters;
}

export function filterModelToParams(
  filters: FilterModel
): URLSearchParams | undefined {
  const entries = Object.entries(filters).filter(([, v]) => !isEmpty(v));

  if (!entries.length) return undefined;

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.append(key, String(value));
  }
  return params;
}

export function isEmptyFilterModel(filters: FilterModel): boolean {
  return Object.values(filters).every(isEmpty);
}
