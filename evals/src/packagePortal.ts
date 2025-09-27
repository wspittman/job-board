import { llm } from "../../packages/backend/src/ai/llm.ts";
import { ats } from "../../packages/backend/src/ats/ats.ts";
import { config } from "../../packages/backend/src/config.ts";
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
import type { Context } from "../../packages/backend/src/types/types.ts";

export type {
  ATS,
  InferredBenefitHighlights as BenefitHighlights,
  Company,
  Context,
  Job,
  InferredLocation as Location,
  InferredRemoteEligibility as RemoteEligibility,
  InferredSalaryRange as SalaryRange,
};

export { ats };
export const LLM_MODEL = config.LLM_MODEL;
export const CompanyFn = llm.fillCompanyInfo;
export const JobFn = llm.fillJobInfo;
