import { z } from "dry-utils-openai";
import { CompanySizeBand, CompanyStage } from "./enums.ts";

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

export const InferredCompany = z
  .object({
    website: z
      .string()
      .nullable()
      .describe(
        [
          "Primary company homepage URL. Use https if available.",
          "Prefer the corporate root domain (e.g., https://example.com). Strip tracking params/fragments.",
          "Do not return ATS/job board domains (e.g., *.lever.co, *.greenhouse.io) or careers subdomains.",
          "Prefer corporate homepage over product microsites or social profiles.",
        ].join(" ")
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
        ].join(" ")
      ),
    stage: CompanyStage.nullable(),
    size: CompanySizeBand.nullable(),
    description: z
      .string()
      .nullable()
      .describe(
        [
          "1-3 sentence factual summary of what the company does (product/market, customers, differentiators).",
          "Third person, present tense. Avoid marketing slogans.",
          "Exclude role-specific details (responsibilities, benefits, comp, team stack).",
        ].join(" ")
      ),
  })
  .describe(
    [
      "Company-level metadata extracted from unstructured text.",
      "Set fields to null when not explicitly stated.",
      "Prefer the most recent explicit facts, except foundingYear which should be the original legal founding.",
    ].join(" ")
  );
export type InferredCompany = z.infer<typeof InferredCompany>;
