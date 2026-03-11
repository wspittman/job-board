import type {
  ExtractionBenefitHighlights,
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
  ExtractionRemoteEligibility,
  ExtractionSalaryRange,
} from "../../../backend/src/models/extractionModels.ts";

export type {
  ExtractionBenefitHighlights as BenefitHighlights,
  ExtractionCompany as Company,
  ExtractionJob as Job,
  ExtractionLocation as Location,
  ExtractionRemoteEligibility as RemoteEligibility,
  ExtractionSalaryRange as SalaryRange,
};

export const atsTypes = ["greenhouse", "lever"] as const;
export type ATS = (typeof atsTypes)[number];

export const dataModelTypes = ["company", "job"] as const;
export type DataModel = (typeof dataModelTypes)[number];

export const llmActionTypes = [
  "fillCompanyInfo",
  "fillJobInfo",
  "extractLocation",
  "isGeneralApplication",
  "interpretFilters",
] as const;
export type LLMAction = (typeof llmActionTypes)[number];
