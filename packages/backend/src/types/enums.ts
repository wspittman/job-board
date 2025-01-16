// #region DB Enums

// Do not change any previously-shipped values or you are gonna have a bad time.

export enum Stage {
  Seed = 0,
  SeriesA = 1,
  SeriesB = 2,
  SeriesC = 3,
  SeriesDPlus = 4,
  Public = 5,
  Bootstrapped = 6,
}

export enum Visa {
  SponsorshipAvailable = 0,
  TransferAccepted = 1,
  NotAvailable = 2,
}

export enum Office {
  Remote = 0,
  Onsite = 1,
  Hybrid = 2,
}

export enum PayRate {
  Hourly = 0,
  Salary = 1,
  Stipend = 2,
  OTE = 3,
}

export enum JobType {
  FullTime = 0,
  PartTime = 1,
  Contract = 2,
  Temporary = 3,
  Internship = 4,
}

export enum Education {
  Associates = 0,
  Bachelors = 1,
  Masters = 2,
  PhD = 3,
}

export enum OrgSize {
  One = 0,
  Ten = 1,
  Fifty = 2,
  TwoHundred = 3,
  FiveHundred = 4,
  Thousand = 5,
  FiveThousand = 6,
  TenThousand = 7,
}

type Enum = Record<string, any>;
type EnumLookup<E extends Enum> = Record<string, E[keyof E]>;

const enumLookups = new Map<Enum, EnumLookup<any>>([
  [Stage, createEnumLookup(Stage)],
]);

// #endregion

// TODO: We might not need any of this since ZOD/OpenAI Parse takes care of it for us

/**
 * Given a string value and an enum, return the enum value that matches the string, or undefined.
 */
export function asEnum<E extends Enum>(
  value: string,
  enumType: E
): E[keyof E] | undefined {
  // Ignore whitespace and casing
  return enumLookups.get(enumType)?.[value.replace(/\s+/g, "").toLowerCase()];
}

/**
 * Given an enum, create a lookup object that maps the lowercase key to the enum value.
 */
function createEnumLookup<E extends Enum>(enumType: E): EnumLookup<E> {
  return Object.fromEntries(
    Object.entries(enumType)
      // Ignore numeric keys, since enums have both-ways lookups
      .filter((key) => isNaN(Number(key)))
      .map(([key, value]) => [key.toLowerCase(), value])
  );
}
