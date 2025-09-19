import { z } from "dry-utils-openai";

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
