import type {
  BenefitHighlights,
  Company,
  Job,
  LLMAction,
  Location,
  RemoteEligibility,
  SalaryRange,
} from "../../portal/pTypes.ts";
import type { Bag } from "../../types.ts";
import type { Rubric } from "../evalTypes.ts";
import {
  arrayExactMatcher,
  equals,
  equalsCasePreferred,
  equalsUrl,
  similar,
} from "./checks.ts";

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
  jdLanguage: equals,
};

// #endregion

export const rubrics: Record<LLMAction, Rubric<Bag>> = {
  fillCompanyInfo: rubricCompany,
  fillJobInfo: rubricJob,
  extractLocation: rubricLocation,
  isGeneralApplication: { bool: equals },
  // TBD on a filters rubric
  interpretFilters: {},
};
