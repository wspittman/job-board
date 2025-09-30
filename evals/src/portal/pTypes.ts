import type {
  InferredBenefitHighlights,
  InferredCompany,
  InferredJob,
  InferredLocation,
  InferredRemoteEligibility,
  InferredSalaryRange,
} from "../../../packages/backend/src/models/inferredModels.ts";
import type { ATS } from "../../../packages/backend/src/models/models.ts";

export type {
  ATS,
  InferredBenefitHighlights as BenefitHighlights,
  InferredCompany as Company,
  InferredJob as Job,
  InferredLocation as Location,
  InferredRemoteEligibility as RemoteEligibility,
  InferredSalaryRange as SalaryRange,
};

export type DataModel = "company" | "job";
