/** Company funding stage or public trading status */
export const StageEnum = [
  "Bootstrapped",
  "Seed",
  "SeriesA",
  "SeriesB",
  "SeriesC",
  "SeriesDPlus",
  "Public",
  "NonProfit",
] as const;
export type Stage = (typeof StageEnum)[number];

/** Company's visa sponsorship policy */
export const VisaEnum = [
  "NotAvailable",
  "TransferAccepted",
  "SponsorshipAvailable",
] as const;
export type Visa = (typeof VisaEnum)[number];

/** Job location/remote work policy */
export const OfficeEnum = ["Onsite", "Hybrid", "Remote"] as const;
export type Office = (typeof OfficeEnum)[number];

/** Pay rate type */
export const PayRateEnum = ["Stipend", "Hourly", "OTE", "Salary"] as const;
export type PayRate = (typeof PayRateEnum)[number];

/** Job type */
export const JobTypeEnum = [
  "Internship",
  "Temporary",
  "Contract",
  "PartTime",
  "FullTime",
] as const;
export type JobType = (typeof JobTypeEnum)[number];

/** Education level */
export const EducationEnum = [
  "Associates",
  "Bachelors",
  "Masters",
  "PhD",
] as const;
export type Education = (typeof EducationEnum)[number];

/** Company industry classifications */
export const IndustryEnum = [
  "Agriculture & Food Production",
  "Construction & Real Estate",
  "Education & Training",
  "Energy & Utilities",
  "Financial Services & Insurance",
  "Government & Public Sector",
  "Healthcare & Life Sciences",
  "Hospitality, Travel & Tourism",
  "Manufacturing & Engineering",
  "Media, Marketing & Communications",
  "Non-Profit & Social Services",
  "Professional Services & Consulting",
  "Retail & Consumer Goods",
  "Transportation & Logistics",
  "Technology & Software",
  "Other",
] as const;
export type Industry = (typeof IndustryEnum)[number];
