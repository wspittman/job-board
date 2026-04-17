import { llm } from "../../../backend/src/ai/llm.ts";
import type {
  ExtractionBenefitHighlights,
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
  ExtractionRemoteEligibility,
  ExtractionSalaryRange,
} from "../../../backend/src/models/extractionModels.ts";
import type { Context } from "../../../backend/src/types/types.ts";

export type {
  ExtractionBenefitHighlights as BenefitHighlights,
  ExtractionCompany as Company,
  Context,
  ExtractionJob as Job,
  ExtractionLocation as Location,
  ExtractionRemoteEligibility as RemoteEligibility,
  ExtractionSalaryRange as SalaryRange,
};

export const atsTypes = ["greenhouse", "lever"] as const;
export type ATS = (typeof atsTypes)[number];

export const dataModelTypes = ["company", "job"] as const;
export type DataModel = (typeof dataModelTypes)[number];

export type LLMAction = keyof typeof llm;
export const llmActionTypes = Object.getOwnPropertyNames(
  Object.getPrototypeOf(llm),
) as LLMAction[];
