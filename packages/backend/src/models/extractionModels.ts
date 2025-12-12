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

const zString = (...desc: string[]) => z.string().describe(desc.join(" "));
const zPosNum = (...desc: string[]) =>
  z.number().min(-1).describe(desc.join(" "));

export const ExtractionCompany = z
  .object({
    website: zString(
      "Primary company homepage URL. Use https if available.",
      "Prefer the corporate root domain (e.g., https://www.example.com). Strip tracking params/fragments.",
      "Exclude ATS/careers and vendor subdomains (e.g., *.lever.co, *.greenhouse.io, careers.example.com).",
      "If no URL is explicitly stated, return ''.",
      "Example: 'Visit us at www.example.com' → 'https://www.example.com'.",
    ),
    foundingYear: z
      .number()
      .min(-1)
      .max(new Date().getFullYear())
      .describe(
        [
          "Four-digit legal founding year (YYYY).",
          "If both founding and launch years are present, return the founding year.",
          "If no founding year is explicitly stated, return -1.",
          "Example: 'Founded in 2014; launched 2016' → 2014.",
        ].join(" "),
      ),
    stage: CompanyStage,
    size: CompanySizeBand,
    description: zString(
      "1-3 sentence factual summary of what the company does (product/market, customers, differentiators).",
      "Third person, present tense. Avoid marketing slogans.",
      "Exclude role-specific details (responsibilities, benefits, comp, team stack).",
      "If no company details are present, return ''.",
    ),
  })
  .describe(
    [
      "Company-level facts explicitly stated in the source.",
      "Prefer the most recent explicit facts, except foundingYear which should be the original legal founding.",
    ].join(" "),
  );
export type ExtractionCompany = z.infer<typeof ExtractionCompany>;

export const ExtractionLocation = z
  .object({
    city: zString(
      "City name in English.",
      "Exclude country/region names.",
      "Examples:",
      "'Located in downtown Seattle' → Seattle;",
      "'Our office is in Cologne, Germany' → Cologne;",
      "'We are headquartered in São Paulo' → São Paulo;",
      "'Remote US only' → ''.",
    ),
    regionCode: zString(
      "ISO 3166-2 subdivision code (uppercase) excluding country prefix.",
      "Examples:",
      "'Located in downtown Seattle' → WA;",
      "'Our office is in Cologne, Germany' → NW;",
      "'We are headquartered in São Paulo' → SP;",
      "'Remote US only' → ''.",
    ),
    countryCode: zString(
      "ISO 3166-1 alpha-2 country code (uppercase).",
      "When the role is explicitly global-remote with no country restriction, return ''.",
      "Examples:",
      "'Located in downtown Seattle' → US;",
      "'Our office is in Cologne, Germany' → DE;",
      "'We are headquartered in São Paulo' → BR;",
      "'Remote US only' → US.",
      "'Remote worldwide' → ''.",
    ),
  })
  .describe(
    [
      "Normalized single location explicitly stated for the context.",
      "When the context is remote, use the primary office location if stated.",
    ].join(" "),
  );
export type ExtractionLocation = z.infer<typeof ExtractionLocation>;

export const ExtractionRemoteEligibility = z
  .object({
    countries: z
      .array(z.string())
      .describe(
        [
          "Array of ISO 3166-1 alpha-2 country codes (uppercase).",
          "If no country restrictions are explicitly stated, return an empty array.",
          "Examples:",
          "'Remote (US and Canada only)' → ['US', 'CA'].",
          "'Remote worldwide' → [].",
        ].join(" "),
      ),
    regions: z
      .array(z.string())
      .describe(
        [
          "List of complete ISO 3166-2 subdivision codes (uppercase) (including country prefix).",
          "If no region restrictions are explicitly stated, return an empty array.",
          "Examples:",
          "'Remote (NY, CA, TX)' → ['US-NY', 'US-CA', 'US-TX'].",
          "'Remote (US only)' → [].",
          "'Remote worldwide' → [].",
        ].join(" "),
      ),
    notes: zString().describe(
      [
        "Freeform clarifications, in this order: restrictions, exclusions, preferences, other.",
        "This might include time-zone limits, legal entity constraints, work authorization requirements, and other factors.",
        "When the role is not remote or no clarifications are needed, return ''",
      ].join(" "),
    ),
  })
  .describe(
    [
      "Remote work eligibility as explicitly stated.",
      "Uppercase codes, no duplicates.",
    ].join(" "),
  );
export type ExtractionRemoteEligibility = z.infer<
  typeof ExtractionRemoteEligibility
>;

export const ExtractionSalaryRange = z
  .object({
    currency: zString("ISO 4217 currency code (uppercase), e.g. 'USD'."),
    cadence: PayCadence,
    min: zPosNum(
      "Minimum salary in the stated currency and cadence.",
      "If not explicitly stated, return -1.",
    ),
    max: zPosNum(
      "Maximum salary in the stated currency and cadence.",
      "If not explicitly stated, return -1.",
    ),
    minOTE: zPosNum(
      "Minimum on-target earnings (base + target variable comp) in the stated currency and cadence.",
      "If variable comp is not explicitly stated, return -1.",
    ),
    maxOTE: zPosNum(
      "Maximum on-target earnings (base + target variable comp) in the stated currency and cadence.",
      "If variable comp is not explicitly stated, return -1.",
    ),
  })
  .describe(
    [
      "Salary figures as stated, normalized to a single currency",
      "If only one number is provided, set both min and max to that number.",
      "Ensure min ≤ max",
    ].join(" "),
  );
export type ExtractionSalaryRange = z.infer<typeof ExtractionSalaryRange>;

export const ExtractionBenefitHighlights = z
  .object({
    healthEmployerCoveragePct: z
      .number()
      .min(-1)
      .max(100)
      .describe(
        [
          "Employer-paid share of employee health insurance premium, 0-100.",
          "If not explicitly stated, return -1.",
        ].join(" "),
      ),
    ptoDays: z
      .union([
        zPosNum(
          "Paid time off days per year (business days, excluding company holidays and sick leave).",
          "If PTO days are not explicitly stated, return -1.",
          "Examples:",
          "'15 days PTO' → 15;",
          "'3 weeks vacation' → 15;",
        ),
        z.literal("Unlimited"),
      ])
      .describe(
        "The number of paid time off days, or 'Unlimited' if role provides an unlimited PTO benefit.",
      ),
    parentalLeaveWeeks: zPosNum(
      "Fully paid parental leave weeks (total weeks of pay available to a new parent).",
      "If parental leave amount is not explicitly stated, return -1.",
      "Example: '12 weeks paid parental leave' → '12'.",
    ),
  })
  .describe(
    [
      "Key benefits as explicitly stated.",
      "Use numeric scalars; do not convert units.",
    ].join(" "),
  );
export type ExtractionBenefitHighlights = z.infer<
  typeof ExtractionBenefitHighlights
>;

export const ExtractionJob = z
  .object({
    presence: Presence,
    workTimeBasis: WorkTimeBasis,
    engagementType: EngagementType,
    jobFamily: JobFamily,
    seniorityLevel: SeniorityLevel,
    primaryLocation: ExtractionLocation,
    remoteEligibility: ExtractionRemoteEligibility,
    salaryRange: ExtractionSalaryRange,
    benefitHighlights: ExtractionBenefitHighlights,
    requiredEducation: EducationLevel,
    requiredExperience: zPosNum(
      "Minimum years of experience explicitly required.",
      "For ranges, use the lower bound.",
      "For 'X+ years', use X.",
      "If not explicitly stated, return -1.",
      "Examples:",
      "'5-8 years' → 5;",
      "'3+ years' → 3;",
    ),
    summary: zString(
      "1-2 sentence factual summary of the role's key responsibilities.",
      "Third person, present tense.",
      "Use active voice and specific technologies/skills.",
      "Do not repeat the company or job title.",
      "No marketing fluff. No internal reasoning.",
    ),
  })
  .describe(
    [
      "Job-level facts explicitly stated for the role.",
      "Set string fields to '' when not explicitly stated.",
      "Set numeric fields to -1 when not explicitly stated.",
      "Prefer the most recent explicit fact when multiple conflict.",
    ].join(" "),
  );
export type ExtractionJob = z.infer<typeof ExtractionJob>;
