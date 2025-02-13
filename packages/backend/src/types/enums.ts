/*
These enums are used to define database data values.
Do not change any previously-shipped values or you are gonna have a bad time.
The assigned values have a large spread to allow for future additions.
*/

/** Company funding stage or public trading status */
export enum Stage {
  Bootstrapped = 100,
  Seed = 200,
  SeriesA = 300,
  SeriesB = 400,
  SeriesC = 500,
  SeriesDPlus = 600,
  Public = 700,
}

/** Company's visa sponsorship policy */
export enum Visa {
  NotAvailable = 100,
  TransferAccepted = 200,
  SponsorshipAvailable = 300,
}

/** Job location/remote work policy */
export enum Office {
  Onsite = 100,
  Hybrid = 200,
  Remote = 300,
}

/** Pay rate type */
export enum PayRate {
  Stipend = 100,
  Hourly = 200,
  OTE = 300,
  Salary = 400,
}

/** Job type */
export enum JobType {
  Internship = 100,
  Temporary = 200,
  Contract = 300,
  PartTime = 400,
  FullTime = 500,
}

/** Education level */
export enum Education {
  Associates = 100,
  Bachelors = 200,
  Masters = 300,
  PhD = 400,
}

/** Organization size */
export enum OrgSize {
  One = 100,
  Ten = 200,
  Fifty = 300,
  TwoHundred = 400,
  FiveHundred = 500,
  Thousand = 600,
  FiveThousand = 700,
  TenThousand = 800,
}
