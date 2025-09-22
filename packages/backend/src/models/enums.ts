import { z } from "dry-utils-openai";

// #region Company

export const CompanySizeBand = z
  .enum([
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5001-10000",
    "10000+",
  ] as const)
  .describe(
    [
      "Company employee headcount band.",
      "Return only if a numeric headcount or explicit range is stated.",
      "Do not infer from adjectives or team sizes.",
      "Inclusive bounds; map open-ended phrases like '10k+' to 10000+.",
      "Example: 'We are a small team of 15 passionate individuals' → '11-50'",
    ].join(" ")
  );
export type CompanySizeBand = z.infer<typeof CompanySizeBand>;

export const CompanyStage = z
  .enum([
    "bootstrapped",
    "pre_seed",
    "seed",
    "series_a",
    "series_b",
    "series_c",
    "series_d_plus",
    "private_equity",
    "public",
    "nonprofit",
  ] as const)
  .describe(
    [
      "Most recent explicitly named financing/maturity stage.",
      "Do not infer from 'startup' or reported raise amounts alone.",
      "Map D/E/F/late-stage growth to series_d_plus.",
      "If explicitly public (listed/IPO/SPAC), return public.",
      "Return nonprofit only if legal status is stated.",
      "Example: 'We are self-funded and profitable' → 'bootstrapped'",
      "Example: 'We raised a $30M Series C round last year' → 'series_c'",
      "Example: 'We recently closed our Series E funding round' → 'series_d_plus'",
      "Example: 'We are a publicly traded company' → 'public'",
      "Example: 'We are a 501(c)(3) nonprofit organization' → 'nonprofit'",
    ].join(" ")
  );
export type CompanyStage = z.infer<typeof CompanyStage>;

// #endregion

// #region Job

export const WorkModel = z
  .enum(["onsite", "remote", "hybrid"] as const)
  .describe(
    [
      "The work model for the job.",
      "Return only if explicitly stated.",
      "Map general phrases to specific values.",
      "Example: 'This is a remote position' → 'remote'",
      "Example: 'We offer flexible work arrangements including hybrid options' → 'hybrid'",
      "Example: 'Candidates must be willing to work at our headquarters' → 'onsite'",
    ].join(" ")
  );
export type WorkModel = z.infer<typeof WorkModel>;

export const SeniorityLevel = z
  .enum([
    "intern",
    "entry",
    "mid",
    "senior",
    "staff+",
    "manager",
    "director",
    "executive",
  ] as const)
  .describe(
    [
      "The seniority level of the job.",
      "Map common synonyms to specific values.",
      "If unclear, make an educated guess based on years of experience and job responsibilities.",
      "Example: 'We are looking for a senior software engineer' → 'senior'",
      "Example: 'This is an entry-level position' → 'entry'",
      "Example: 'We are hiring a Principal Data Scientist' → 'staff+'",
      "Example: 'We need a director of marketing' → 'director'",
    ].join(" ")
  );
export type SeniorityLevel = z.infer<typeof SeniorityLevel>;

export const JobFamily = z
  .enum([
    "engineering",
    "design",
    "product",
    "data",
    "it",
    "security",
    "marketing",
    "sales",
    "customer_success",
    "ops",
    "finance",
    "hr",
    "legal",
    "other",
  ] as const)
  .describe(
    [
      "The job family/category.",
      "Map common roles to specific families.",
      "Example: 'We are hiring a UX designer' → 'design'",
      "Example: 'As a Customer Support Specialist, you will assist clients' → 'customer_success'",
      "Example: 'This role is for a Recruiting Coordinator' → 'hr'",
      "Example: 'We need a cybersecurity analyst' → 'security'",
      "Example: 'Join our sales team as an Account Executive' → 'sales'",
    ].join(" ")
  );
export type JobFamily = z.infer<typeof JobFamily>;

// #endregion
