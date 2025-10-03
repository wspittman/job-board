import type {
  ExtractionBenefitHighlights,
  ExtractionCompany,
  ExtractionJob,
  ExtractionLocation,
  ExtractionRemoteEligibility,
  ExtractionSalaryRange,
} from "../../../packages/backend/src/models/extractionModels.ts";
import type { ATS } from "../../../packages/backend/src/models/models.ts";

export type {
  ATS,
  ExtractionBenefitHighlights as BenefitHighlights,
  ExtractionCompany as Company,
  ExtractionJob as Job,
  ExtractionLocation as Location,
  ExtractionRemoteEligibility as RemoteEligibility,
  ExtractionSalaryRange as SalaryRange,
};

export type DataModel = "company" | "job";
