import {
  arrayExactMatcher,
  equals,
  equalsCasePreferred,
  equalsUrl,
  Rubric,
  similar,
} from "./judge/checks.ts";
import type {
  BenefitHighlights,
  Company,
  DataModel,
  Job,
  Location,
  RemoteEligibility,
  SalaryRange,
} from "./portal/pTypes.ts";
import type { Bag } from "./types/types.ts";

// Model costs per million tokens [input, output], last pulled 9/25/2025
export const llmModelCost: Record<string, [number, number]> = {
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4o": [2.5, 10.0],

  "gpt-4.1-nano": [0.1, 0.4],
  "gpt-4.1-mini": [0.4, 1.6],
  "gpt-4.1": [2.0, 8.0],

  "gpt-5-nano": [0.05, 0.4],
  "gpt-5-mini": [0.25, 2.0],
  "gpt-5": [1.25, 10.0],

  "o3-mini": [1.1, 4.4],
  "o4-mini": [1.1, 4.4],
  o3: [2.0, 8.0],
};

// OLD: Model costs per million tokens (input, output), last pulled 5/20/2025
/*const google: ModelTuple[] = [
  ["gemini-1.5-flash-8b", 0.0375, 0.15],
  ["gemini-2.0-flash-lite", 0.075, 0.3],
  ["gemini-2.0-flash", 0.1, 0.4],
  ["gemini-2.5-flash", 0.15, 0.6],
  ["gemini-2.5-flash-thinking", 0.15, 3.5],
  ["gemini-1.5-pro", 1.25, 5.0],
  ["gemini-1.5-pro-128k", 2.5, 10.0],
  ["gemini-2.5-pro-preview-03-25", 1.25, 10.0],
];*/

// #region Rubrics

const rubricCompany: Rubric<Company> = {
  website: equalsUrl,
  foundingYear: equals,
  stage: equals,
  size: equals,
  description: similar,
};

const rubricLocation: Rubric<Location> = {
  city: equalsCasePreferred,
  regionCode: equalsCasePreferred,
  countryCode: equalsCasePreferred,
};

const rubricRemoteEligibility: Rubric<RemoteEligibility> = {
  countries: arrayExactMatcher,
  regions: arrayExactMatcher,
  notes: similar,
};

const rubricSalaryRange: Rubric<SalaryRange> = {
  currency: equalsCasePreferred,
  cadence: equals,
  min: equals,
  max: equals,
  minOTE: equals,
  maxOTE: equals,
};

const rubricBenefitHighlights: Rubric<BenefitHighlights> = {
  healthEmployerCoveragePct: equals,
  ptoDays: equals,
  parentalLeaveWeeks: equals,
};

const rubricJob: Rubric<Job> = {
  presence: equals,
  workTimeBasis: equals,
  engagementType: equals,
  jobFamily: equals,
  seniorityLevel: equals,
  primaryLocation: rubricLocation,
  remoteEligibility: rubricRemoteEligibility,
  salaryRange: rubricSalaryRange,
  benefitHighlights: rubricBenefitHighlights,
  requiredEducation: equals,
  requiredExperience: equals,
  summary: similar,
};

// #endregion

export const rubrics: Record<DataModel, Rubric<Bag>> = {
  company: rubricCompany,
  job: rubricJob,
};
