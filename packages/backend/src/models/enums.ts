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
    "",
  ] as const)
  .describe(
    [
      "Company employee headcount band.",
      "Do not infer from adjectives, team sizes, or user/customer counts.",
      "Inclusive bounds; map open-ended phrases like '10k+' to 10000+.",
      "If a numeric headcount or explicit range is not stated, return ''.",
      "Examples:",
      "'We are a small team of 15 passionate individuals' → 11-50;",
      "'With over 100 employees, we are growing fast' → 51-200;",
      "'We are a small team of like-minded individuals' → '';",
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
    "",
  ] as const)
  .describe(
    [
      "Most recent explicitly named financing/maturity stage.",
      "Do not infer from 'startup' or reported raise amounts alone.",
      "Map D/E/F/late-stage growth to series_d_plus.",
      "If explicitly public (listed/IPO/SPAC), return public.",
      "Return nonprofit only if legal status is stated.",
      "If not explicitly stated, return ''.",
      "Examples:",
      "'We are self-funded and profitable' → bootstrapped;",
      "'We raised a $30M Series C round last year' → series_c;",
      "'We recently closed our Series E funding round' → series_d_plus;",
      "'We are a publicly traded company' → public;",
      "'We are a 501(c)(3) nonprofit organization' → nonprofit;",
      "'We are a fast-growing, venture-backed startup' → '';",
    ].join(" ")
  );
export type CompanyStage = z.infer<typeof CompanyStage>;

// #endregion

// #region Job

export const Presence = z
  .enum(["onsite", "remote", "hybrid", ""] as const)
  .describe(
    [
      "The presence mode for the job.",
      "Map general phrases to specific values.",
      "Jobs with a mix of onsite and remote work should be classified as 'hybrid'.",
      "Jobs that are fully remote but require occasional onsite visits (e.g., quarterly) should be classified as 'remote'.",
      "Jobs are based at a specific office location but require offsite travel (e.g., client sites) should be classified as 'onsite'.",
      "Prefer explicit mentions, but you may infer based on context.",
      "If there is inadequate or conflicting info, return ''.",
      "Examples:",
      "'Remote (US only)' → remote;",
      "'We offer flexible work arrangements including hybrid options' → hybrid;",
      "'Candidates must be willing to work at our headquarters' → onsite;",
    ].join(" ")
  );
export type Presence = z.infer<typeof Presence>;

/**
 * Hours expectation / schedule basis.
 */
export const WorkTimeBasis = z
  .enum([
    "full_time", // ~35–40+ hours, standard benefits typically apply
    "part_time", // <35–40 hours, proportionate benefits
    "variable", // fluctuating hours, e.g., staffing/on-call
    "per_diem", // day-rate or shift-based, zero guaranteed hours
    "",
  ] as const)
  .describe(
    [
      "Hours expectation / schedule basis.",
      "Prefer explicit mentions, but you may infer 'full_time' if the context supports it.",
      "If there is inadequate or conflicting info, return ''.",
      "Examples:",
      "'FT', '40 hrs/wk' → full_time;",
      "'PT', '20 hrs/wk' → part_time;",
      "'Independent Contractor - paid per game covered' → per_diem;",
      "'as-needed/on-call' → variable or per_diem (choose per_diem if day/shift-based pay).",
    ].join(" ")
  );
export type WorkTimeBasis = z.infer<typeof WorkTimeBasis>;

/**
 * Legal/contractual relationship with the hiring org.
 */
export const EngagementType = z
  .enum([
    "employee_permanent", // direct hire, open-ended employment
    "employee_fixed_term", // direct hire, fixed end date (e.g., 6–12 mo)
    "contractor", // independent contractor / B2B / freelance
    "agency_temp", // employed by a staffing agency; assigned to client
    "internship", // student/early-career program
    "apprenticeship", // earn-while-you-learn track, formal training
    "fellowship", // time-bound sponsored role (often research/policy)
    "",
  ] as const)
  .describe(
    [
      "Legal/contractual relationship with the hiring org.",
      "Prefer explicit mentions, but you may infer 'employee_permanent' if the context supports it.",
      "If there is inadequate or conflicting info, return ''.",
      "Examples:",
      "'W-2, full benefits' → employee_permanent;",
      "'6-month fixed-term employee' → employee_fixed_term;",
      "'1099 contractor' → contractor;",
      "'through Adecco' → agency_temp;",
      "'summer internship' → internship.",
    ].join(" ")
  );
export type EngagementType = z.infer<typeof EngagementType>;

export const PayCadence = z
  .enum(["salary", "hourly", "stipend", ""] as const)
  .describe(
    [
      "The pay cadence for the job.",
      "Map common phrases to specific values.",
      "Prefer explicit mentions, but you may infer 'salary' if the context supports it.",
      "If there is inadequate or conflicting info, return ''.",
      "Examples:",
      "'The pay range is $100,000 to $120,000' → salary;",
      "'Pay rate is $20/hour' → hourly;",
      "'This is a paid internship with a stipend' → stipend;",
    ].join(" ")
  );
export type PayCadence = z.infer<typeof PayCadence>;

export const SeniorityLevel = z
  .enum([
    "intern",
    "entry",
    "mid",
    "senior",
    "staff+",
    "manager",
    "director+",
    "",
  ] as const)
  .describe(
    [
      "The seniority level of the job.",
      "Map common synonyms to specific values.",
      "If the role has direct reports or managerial duties, classify as 'manager' or 'director+'.",
      "Prefer explicit mentions, but you may infer based on years of experience and job responsibilities.",
      "When inferring based on years of experience, entry = 0-2, mid = 3-5, senior = 6-9, staff+ = 10+.",
      "If there is inadequate or conflicting info, return ''.",
      "Examples:",
      "'We are looking for a senior software engineer' → senior;",
      "'This is an entry-level position' → entry;",
      "'We are hiring a Principal Data Scientist' → staff+;",
      "'You will be managing a team of 5 engineers' → manager;",
      "'We need a director of marketing' → director+;",
      "'As the Head of Sales, you will lead our sales team' → director+;",
    ].join(" ")
  );
export type SeniorityLevel = z.infer<typeof SeniorityLevel>;

export const EducationLevel = z
  .enum([
    "high_school",
    "associate",
    "bachelor",
    "master",
    "doctorate",
    "",
  ] as const)
  .describe(
    [
      "The minimum education level explicitly required.",
      "Map common phrases to specific values.",
      "If not explicitly stated, return ''.",
      "Examples:",
      "'Bachelor's degree in Computer Science required' → bachelor;",
      "'Master's degree preferred, but Bachelor's is considered' → bachelor;",
      "'PhD in relevant field required' → doctorate;",
    ].join(" ")
  );
export type EducationLevel = z.infer<typeof EducationLevel>;

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
    "",
  ] as const)
  .describe(
    [
      "The job family/category.",
      "Map common roles to specific families.",
      "If the role spans multiple families, choose the primary one.",
      "If the role does not fit any family or is unclear, return ''.",
      "Examples:",
      "'We are hiring a UX designer' → design;",
      "'As a Customer Support Specialist, you will assist clients' → customer_success;",
      "'This role is for a Recruiting Coordinator' → hr;",
      "'We need a cybersecurity analyst' → security;",
      "'Join our sales team as an Account Executive' → sales;",
      "'We need a background music composer' → '';",
    ].join(" ")
  );
export type JobFamily = z.infer<typeof JobFamily>;

// #endregion
