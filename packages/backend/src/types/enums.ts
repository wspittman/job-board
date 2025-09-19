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
