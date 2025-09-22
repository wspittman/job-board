import { z } from "dry-utils-openai";
import {
  CompanySizeBand,
  CompanyStage,
  JobFamily,
  SeniorityLevel,
  WorkModel,
} from "./enums.ts";

/*
Schema properties that are supported by both OpenAI, Gemini, and Zod

String
- z.email(); // => { type: "string", format: "email" }
- z.iso.datetime(); // => { type: "string", format: "date-time" }
- z.iso.date(); // => { type: "string", format: "date" }
- z.iso.time(); // => { type: "string", format: "time" }
- z.iso.duration(); // => { type: "string", format: "duration" }
- z.ipv4(); // => { type: "string", format: "ipv4" }
- z.ipv6(); // => { type: "string", format: "ipv6" }
- z.uuid(); // => { type: "string", format: "uuid" }

Number
- maximum — The number must be less than or equal to this value.
- minimum — The number must be greater than or equal to this value.

Array
- minItems — The array must have at least this many items.
- maxItems — The array must have at most this many items.
*/

const zString = (...desc: string[]) =>
  z.string().nullable().describe(desc.join(" "));
const zPosNum = (...desc: string[]) =>
  z.number().min(0).nullable().describe(desc.join(" "));

export const InferredCompany = z
  .object({
    website: zString(
      "Primary company homepage URL. Use https if available.",
      "Prefer the corporate root domain (e.g., https://example.com). Strip tracking params/fragments.",
      "Exclude ATS/careers and vendor subdomains (e.g., *.lever.co, *.greenhouse.io, careers.example.com).",
      "Example: 'Visit us at example.com' → 'https://example.com'"
    ),
    foundingYear: z
      .number()
      .min(1800)
      .max(new Date().getFullYear())
      .nullable()
      .describe(
        [
          "Four-digit legal founding year (YYYY).",
          "Valid range 1800-current year.",
          "If both founding and launch years are present, return the founding year.",
          "Example: 'Founded in 2014; launched 2016' → 2014",
        ].join(" ")
      ),
    stage: CompanyStage.nullable(),
    size: CompanySizeBand.nullable(),
    description: zString(
      "1-3 sentence factual summary of what the company does (product/market, customers, differentiators).",
      "Third person, present tense. Avoid marketing slogans.",
      "Exclude role-specific details (responsibilities, benefits, comp, team stack)."
    ),
  })
  .describe(
    [
      "Company-level facts explicitly stated in the source.",
      "Set fields to null when not explicitly stated.",
      "Prefer the most recent explicit facts, except foundingYear which should be the original legal founding.",
    ].join(" ")
  );
export type InferredCompany = z.infer<typeof InferredCompany>;

export const InferredLocation = z
  .object({
    city: zString(
      "City name in English.",
      "Exclude country/region names.",
      "Example: 'Seattle, WA' → 'Seattle'"
    ),
    regionCode: zString(
      "ISO 3166-2 subdivision code (uppercase) excluding country prefix.",
      "Examples: 'Located in downtown Seattle' → 'WA'"
    ),
    countryCode: zString(
      "ISO 3166-1 alpha-2 country code (uppercase).",
      "Use null only when the role is explicitly global-remote with no country restriction.",
      "Example: 'Located in downtown Seattle' → 'US'"
    ),
  })
  .describe(
    [
      "Normalized single location explicitly stated for the context.",
      "Set fields to null when not explicitly stated.",
      "Prefer the most recent explicit location mentioned.",
    ].join(" ")
  );
export type InferredLocation = z.infer<typeof InferredLocation>;

export const InferredRemoteEligibility = z
  .object({
    countries: z
      .array(z.string())
      .nullable()
      .describe(
        [
          "Array of ISO 3166-1 alpha-2 country codes (uppercase).",
          "Use null if no country restrictions are explicitly stated.",
        ].join(" ")
      ),
    regions: z
      .array(z.string())
      .nullable()
      .describe(
        [
          "List of ISO 3166-2 subdivision codes (uppercase).",
          "Use null if no region restrictions are explicitly stated.",
        ].join(" ")
      ),
    notes: zString().describe(
      "Freeform clarifications (e.g., time-zone limits, legal entity constraints, 'no contractors', 'US work authorization required')."
    ),
  })
  .describe(
    [
      "Remote work eligibility as explicitly stated.",
      "Set fields to null when not explicitly stated.",
      "Uppercase codes, no duplicates.",
    ].join(" ")
  );
export type InferredRemoteEligibility = z.infer<
  typeof InferredRemoteEligibility
>;

export const InferredSalaryRange = z
  .object({
    currency: zString("ISO 4217 currency code (uppercase), e.g. 'USD'."),
    isHourly: z
      .boolean()
      .nullable()
      .describe(
        "'true' if compensation is quoted hourly; 'false' if annual or not stated."
      ),
    min: zPosNum("Minimum salary in the stated currency and cadence."),
    max: zPosNum("Maximum salary in the stated currency and cadence."),
  })
  .describe(
    [
      "Salary figures as stated, normalized to a single currency",
      "If only one number is provided, set both min and max to that number.",
      "Ensure min ≤ max",
      "Set fields to null when not explicitly stated.",
    ].join(" ")
  );
export type InferredSalaryRange = z.infer<typeof InferredSalaryRange>;

export const InferredVariableComp = z
  .object({
    targetPercent: zPosNum(
      "Target variable compensation, percent of base.",
      "Example: '20% bonus target' → '20'"
    ),
    minPercent: zPosNum(
      "Minimum variable compensation, percent of base.",
      "Example: '10-25% bonus target' → '10'"
    ),
    maxPercent: zPosNum(
      "Maximum variable compensation, percent of base.",
      "Example: '10-25% bonus target' → '25'"
    ),
    notes: zString(
      "Freeform clarifications (e.g., sales commission plan, equity not included, conditions)."
    ),
  })
  .describe(
    [
      "Variable compensation as explicitly stated.",
      "Percentages are of base salary.",
      "Ensure minPercent ≤ maxPercent",
      "Set fields to null when not explicitly stated.",
    ].join(" ")
  );
export type InferredVariableComp = z.infer<typeof InferredVariableComp>;

export const InferredBenefitHighlights = z
  .object({
    healthEmployerCoveragePct: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .describe(
        "Employer-paid share of employee health insurance premium, 0-100."
      ),
    ptoDays: zPosNum(
      "Paid time off days per year (business days, excluding company holidays and sick leave).",
      "Example: '15 days PTO' → '15'",
      "Example: '3 weeks vacation' → '15'"
    ),
    parentalLeaveWeeks: zPosNum(
      "Fully paid parental leave weeks (total weeks of pay available to a new parent).",
      "Example: '12 weeks paid parental leave' → '12'"
    ),
  })
  .describe(
    [
      "Key benefits as explicitly stated.",
      "Use numeric scalars; do not convert units.",
      "Set fields to null when not explicitly stated.",
    ].join(" ")
  );
export type InferredBenefitHighlights = z.infer<
  typeof InferredBenefitHighlights
>;

export const InferredJob = z
  .object({
    workModel: WorkModel.nullable(),
    seniorityLevel: SeniorityLevel.nullable(),
    jobFamily: JobFamily.nullable(),
    primaryLocation: InferredLocation,
    remoteEligibility: InferredRemoteEligibility,
    salaryRange: InferredSalaryRange,
    variableComp: InferredVariableComp,
    benefitHighlights: InferredBenefitHighlights,
    experienceYears: zPosNum(
      "Minimum years of experience explicitly required.",
      "For ranges, use the lower bound.",
      "For 'X+ years', use X.",
      "Example: '5-8 years' → '5'.",
      "Example: '3+ years' → '3'."
    ),
    summary: zString(
      "1-2 sentence factual summary of the role's key responsibilities.",
      "Third person, present tense.",
      "Use active voice and specific technologies/skills.",
      "Do not repeat the company or job title."
    ),
  })
  .describe(
    [
      "Job-level facts explicitly stated for the role.",
      "Set fields to null when not explicitly stated.",
      "Prefer the most recent explicit fact when multiple conflict.",
    ].join(" ")
  );
export type InferredJob = z.infer<typeof InferredJob>;
