import { ats } from "../../packages/backend/src/ats/ats.ts";
import type {
  InferredBenefitHighlights,
  InferredLocation,
  InferredRemoteEligibility,
  InferredSalaryRange,
} from "../../packages/backend/src/models/inferredModels.ts";
import type {
  ATS,
  Company,
  Job,
} from "../../packages/backend/src/models/models.ts";

export type {
  ATS,
  InferredBenefitHighlights as BenefitHighlights,
  Company,
  Job,
  InferredLocation as Location,
  InferredRemoteEligibility as RemoteEligibility,
  InferredSalaryRange as SalaryRange,
};

export { ats };
