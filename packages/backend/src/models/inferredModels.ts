import { z } from "dry-utils-openai";
import {
  CompanySizeBand,
  CompanyStage,
  EducationLevel,
  EngagementType,
  JobFamily,
  PayCadence,
  Presence,
  SeniorityLevel,
  WorkTimeBasis,
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
      "Prefer the corporate root domain (e.g., https://www.example.com). Strip tracking params/fragments.",
      "Exclude ATS/careers and vendor subdomains (e.g., *.lever.co, *.greenhouse.io, careers.example.com).",
      "Example: 'Visit us at www.example.com' → 'https://www.example.com'."
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
          "Example: 'Founded in 2014; launched 2016' → 2014.",
        ].join(" ")
      ),
    stage: CompanyStage.nullable(),
    size: CompanySizeBand.nullable(),
    description: zString(
      "1-3 sentence factual summary of what the company does (product/market, customers, differentiators).",
      "Third person, present tense. Avoid marketing slogans.",
      "Exclude role-specific details (responsibilities, benefits, comp, team stack).",
      "If no company details are present, return null."
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
      "Examples:",
      "'Located in downtown Seattle' → Seattle;",
      "'Remote US only' → null."
    ),
    regionCode: zString(
      "ISO 3166-2 subdivision code (uppercase) excluding country prefix.",
      "Examples:",
      "'Located in downtown Seattle' → WA;",
      "'Remote US only' → null."
    ),
    countryCode: zString(
      "ISO 3166-1 alpha-2 country code (uppercase).",
      "Use null only when the role is explicitly global-remote with no country restriction.",
      "Examples:",
      "'Located in downtown Seattle' → US;",
      "'Remote US only' → US.",
      "'Remote worldwide' → null."
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
          "Example: 'Remote (US and Canada only)' → ['US', 'CA'].",
        ].join(" ")
      ),
    regions: z
      .array(z.string())
      .nullable()
      .describe(
        [
          "List of complete ISO 3166-2 subdivision codes (uppercase) (including country prefix).",
          "Use null if no region restrictions are explicitly stated.",
          "Example: 'Remote (NY, CA, TX)' → ['US-NY', 'US-CA', 'US-TX'].",
        ].join(" ")
      ),
    notes: zString().describe(
      [
        "Freeform clarifications (e.g., time-zone limits, legal entity constraints, 'no contractors', 'US work authorization required').",
        "Use null if the role is not remote or no clarifications are needed.",
      ].join(" ")
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
    cadence: PayCadence.nullable(),
    min: zPosNum("Minimum salary in the stated currency and cadence."),
    max: zPosNum("Maximum salary in the stated currency and cadence."),
    minOTE: zPosNum(
      "Minimum on-target earnings (base + target variable comp) in the stated currency and cadence.",
      "Set to null if variable comp is not explicitly stated."
    ),
    maxOTE: zPosNum(
      "Maximum on-target earnings (base + target variable comp) in the stated currency and cadence.",
      "Set to null if variable comp is not explicitly stated."
    ),
  })
  .describe(
    [
      "Salary figures as stated, normalized to a single currency",
      "If only one number is provided, set both min and max to that number.",
      "Ensure min ≤ max",
      "Set fields to null, not 0, when not explicitly stated.",
    ].join(" ")
  );
export type InferredSalaryRange = z.infer<typeof InferredSalaryRange>;

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
    ptoDays: z
      .union([
        zPosNum(
          "Paid time off days per year (business days, excluding company holidays and sick leave).",
          "Examples:",
          "'15 days PTO' → 15;",
          "'3 weeks vacation' → 15;"
        ),
        z.literal("Unlimited"),
      ])
      .describe(
        "The number of paid time off days, or 'Unlimited' if role provides an unlimited PTO benefit."
      ),
    parentalLeaveWeeks: zPosNum(
      "Fully paid parental leave weeks (total weeks of pay available to a new parent).",
      "Example: '12 weeks paid parental leave' → '12'."
    ),
  })
  .describe(
    [
      "Key benefits as explicitly stated.",
      "Use numeric scalars; do not convert units.",
      "Set fields to null, not 0, when not explicitly stated.",
    ].join(" ")
  );
export type InferredBenefitHighlights = z.infer<
  typeof InferredBenefitHighlights
>;

export const InferredJob = z
  .object({
    presence: Presence.nullable(),
    workTimeBasis: WorkTimeBasis.nullable(),
    engagementType: EngagementType.nullable(),
    jobFamily: JobFamily.nullable(),
    seniorityLevel: SeniorityLevel.nullable(),
    primaryLocation: InferredLocation.nullable(),
    remoteEligibility: InferredRemoteEligibility.nullable(),
    salaryRange: InferredSalaryRange.nullable(),
    benefitHighlights: InferredBenefitHighlights.nullable(),
    requiredEducation: EducationLevel.nullable(),
    requiredExperience: zPosNum(
      "Minimum years of experience explicitly required.",
      "For ranges, use the lower bound.",
      "For 'X+ years', use X.",
      "Examples:",
      "'5-8 years' → 5;",
      "'3+ years' → 3;"
    ),
    summary: zString(
      "1-2 sentence factual summary of the role's key responsibilities.",
      "Third person, present tense.",
      "Use active voice and specific technologies/skills.",
      "Do not repeat the company or job title.",
      "No marketing fluff. No internal reasoning.",
      "If no useful job details are present, return null."
    ),
  })
  .describe(
    [
      "Job-level facts explicitly stated for the role.",
      "Set fields to null when not explicitly stated.",
      "For numeric fields, use null instead of 0 when not stated.",
      "Prefer the most recent explicit fact when multiple conflict.",
    ].join(" ")
  );
export type InferredJob = z.infer<typeof InferredJob>;

export const InferredJobWithScratchpad = z.object({
  scratchpad: z
    .object({
      jobType: zString(
        "Role identity in ≤2 bullets. Format each bullet: '<facet>: <value>'.",
        "Facets: family (e.g., 'Data Eng'), seniority (e.g., 'Senior'), target profile (e.g., 'Python + Airflow').",
        "Only state if explicit or near-explicit; otherwise write 'unknown'.",
        "Include ≤1 short quote if available."
      ),
      requirements: zString(
        "Key requirements in 3-7 bullets. Each bullet: '[must|nice]: <skill or credential> [evidence: 'quoted phrase']'.",
        "Prefer copy-exact phrases for evidence; paraphrase the label only.",
        "No speculation, no unstated stacks. Merge duplicates."
      ),
      compensation: zString(
        "Verbatim comp facts in normalized lines. One per line:",
        "- base: <number + currency + period if given>.",
        "- bonus/variable: <percent or amount>.",
        "- equity: <units or range + vesting if given>.",
        "- range-statement: <exact quote if a legal range is present>.",
        "If absent, write 'none stated'. Never infer."
      ),
      location: zString(
        "Modality + constraints, 2-5 lines. Use keys:",
        "- modality: <remote|hybrid|onsite>.",
        "- geo: <cities/regions/timezones>.",
        "- cadence: <days onsite / travel %> (if present).",
        "- visa/relocation: <stated terms>.",
        "Add one short evidence quote if ambiguous."
      ),
      other: zString("Other notable facts in 2-5 bullets."),
    })
    .describe(
      [
        "Working notes to stabilize extraction. Stay concise and evidence-anchored.",
        "Use this space to think carefully.",
        "Rules: keep to bullets/keys; prefer quotes for claims; mark unknowns explicitly; no speculation.",
        "Hard caps: each field ≤120 words (summary ≤40).",
      ].join(" ")
    ),
  job: InferredJob,
});
