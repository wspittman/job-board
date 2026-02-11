import {
  toCurrency,
  toJobFamily,
  toJobFamilyLabel,
  toPayCadence,
  toPayCadenceLabel,
  toWorkTimeBasis,
  toWorkTimeBasisLabel,
} from "./apiEnums";
import type { FilterModelApi } from "./apiTypes";
import { metadataModel } from "./metadataModel";

export type FilterModelKey = keyof FilterModelApi;
type FilterModelValue = FilterModelApi[keyof FilterModelApi];

/**
 * Represents the filter criteria for job searches.
 * Provides methods for converting between form data, URL search parameters, and friendly string representations.
 */
export class FilterModel {
  readonly #filters: FilterModelApi = {};

  /**
   * Creates a FilterModel instance from a FormData object.
   * @param formData - The FormData object.
   * @returns A new FilterModel instance.
   */
  static fromFormData(formData: FormData): FilterModel {
    const model = new FilterModel();
    model.#fromFormData(formData);
    return model;
  }

  /**
   * Creates a FilterModel instance from URLSearchParams.
   * @param params - The URLSearchParams object.
   * @returns A new FilterModel instance.
   */
  static fromUrlSearchParams(params: URLSearchParams): FilterModel {
    const model = new FilterModel();
    model.#fromUrlSearchParams(params);
    return model;
  }

  /**
   * Checks if the filter model is empty (contains no active filters).
   * @returns True if the filter model is empty, false otherwise.
   */
  isEmpty(): boolean {
    return Object.values(this.#filters).every(isEmpty);
  }

  /**
   * Checks if the filter model represents a saved job (both companyId and jobId are set).
   * @returns True if the filter model represents a saved job, false otherwise.
   */
  isSavedJob(): boolean {
    return !isEmpty(this.#filters.jobId) && !isEmpty(this.#filters.companyId);
  }

  /**
   * Converts the filter model to URLSearchParams.
   * @returns A URLSearchParams object representing the filters.
   */
  toUrlSearchParams(): URLSearchParams {
    const entries = this.toEntries();
    const params = new URLSearchParams();

    for (const [key, value] of entries) {
      params.append(key, String(value));
    }

    return params;
  }

  /**
   * Converts the filter model to an array of friendly string representations.
   * E.g., ['companyId', 'Company: Google'], ['isRemote', 'Remote'].
   * @returns The array of key-friendly string pairs.
   */
  toFriendlyStrings(): [FilterModelKey, string][] {
    const entries = this.toEntries();

    if (this.isSavedJob()) {
      return [["jobId", `Saved Job`]];
    }

    let company = this.#filters.companyId;
    if (!isEmpty(company)) {
      company = metadataModel.getCompanyFriendlyName(company);
    }

    return entries.map(([key, value]) => {
      switch (key) {
        case "companyId":
          return [key, `Company: ${company}`];
        case "workTimeBasis":
          return [key, toWorkTimeBasisLabel(value)];
        case "jobFamily":
          return [key, toJobFamilyLabel(value)];
        case "payCadence":
          return [key, `Pay by: ${toPayCadenceLabel(value)}`];
        case "currency":
          return [key, `Pay in: ${toCurrency(value)}`];
        case "isRemote":
          return [key, value ? "Remote" : "In-Person / Hybrid"];
        case "title":
          return [key, `Title: ${value}`];
        case "location":
          return [key, `Location: ${value}`];
        case "daysSince":
          return [key, `Posted: Within ${Number(value).toLocaleString()} days`];
        case "maxExperience":
          return [key, `Experience: ${Number(value).toLocaleString()} years`];
        case "minSalary":
          return [key, `Pay Rate: ${Number(value).toLocaleString()}`];
        default:
          return [key, `${key}: ${value}`];
      }
    });
  }

  /**
   * Converts the filter model to an array of key-value pairs, excluding empty values.
   * @returns The array of key-value pairs.
   */
  toEntries(): [FilterModelKey, FilterModelValue][] {
    return Object.entries(this.#filters).filter(([, v]) => !isEmpty(v)) as [
      FilterModelKey,
      FilterModelValue,
    ][];
  }

  #fromFormData(formData: FormData): void {
    this.#fromGeneric((key) => formData.get(key) as string);
  }

  #fromUrlSearchParams(params: URLSearchParams): void {
    this.#fromGeneric((key) => params.get(key));
  }

  #fromGeneric(get: (key: string) => string | null | undefined): void {
    this.#filters.title = normSearchString(get("title"));
    this.#filters.companyId = normIdString(get("companyId"));
    this.#filters.workTimeBasis = toWorkTimeBasis(get("workTimeBasis"));
    this.#filters.jobFamily = toJobFamily(get("jobFamily"));
    this.#filters.payCadence = toPayCadence(get("payCadence"));
    this.#filters.currency = toCurrency(get("currency"));
    this.#filters.isRemote = normBoolean(get("isRemote"));
    this.#filters.location = normSearchString(get("location"));
    this.#filters.minSalary = normNumber(get("minSalary"));
    this.#filters.maxExperience = normNumber(get("maxExperience"));
    this.#filters.daysSince = normNumber(get("daysSince"));
    this.#filters.jobId = !isEmpty(this.#filters.companyId)
      ? normIdString(get("jobId"))
      : undefined;
  }
}

const isEmpty = (v: unknown) => v == undefined || v === "";

const normSearchString = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) || trimmed.length < 3 ? undefined : trimmed;
};

const normIdString = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return isEmpty(trimmed) ? undefined : trimmed;
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
