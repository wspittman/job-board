import { expect, suite, test } from "vitest";
import {
  toCompanyStage,
  toCompanyStageLabel,
  toCurrencyFormat,
  toJobFamily,
  toJobFamilyLabel,
  toPayCadence,
  toPayCadenceLabel,
  toWorkTimeBasis,
  toWorkTimeBasisLabel,
} from "./apiEnums";

suite("apiEnums", () => {
  test.for([
    ["full_time", "Full-time"],
    ["part_time", "Part-time"],
    ["unknown", ""],
    [undefined, ""],
    [null, ""],
  ] as [unknown, string][])(
    "toWorkTimeBasisLabel(%s) → %s",
    ([value, expected]) => {
      expect(toWorkTimeBasisLabel(value)).toBe(expected);
    },
  );

  test.for([
    ["engineering", "Engineering"],
    ["design", "Design"],
    ["data", "Data"],
    ["hr", "Human Resources"],
    ["customer_success", "Customer Success"],
    ["unknown", ""],
    [undefined, ""],
  ] as [unknown, string][])(
    "toJobFamilyLabel(%s) → %s",
    ([value, expected]) => {
      expect(toJobFamilyLabel(value)).toBe(expected);
    },
  );

  test.for([
    ["bootstrapped", "Bootstrapped"],
    ["seed", "Seed"],
    ["series_a", "Series A"],
    ["public", "Public"],
    ["unknown", ""],
    [undefined, ""],
  ] as [unknown, string][])(
    "toCompanyStageLabel(%s) → %s",
    ([value, expected]) => {
      expect(toCompanyStageLabel(value)).toBe(expected);
    },
  );

  test.for([
    ["hourly", "Hour"],
    ["salary", "Year"],
    ["stipend", "Stipend"],
    ["unknown", ""],
    [undefined, ""],
  ] as [unknown, string][])(
    "toPayCadenceLabel(%s) → %s",
    ([value, expected]) => {
      expect(toPayCadenceLabel(value)).toBe(expected);
    },
  );

  test.for([
    ["contract", undefined],
    ["full_time", "full_time"],
  ] as [unknown, string][])("toWorkTimeBasis(%s) → %s", ([value, expected]) => {
    expect(toWorkTimeBasis(value)).toBe(expected);
  });

  test.for([
    ["unknown", undefined],
    ["engineering", "engineering"],
  ] as [unknown, string][])("toJobFamily(%s) → %s", ([value, expected]) => {
    expect(toJobFamily(value)).toBe(expected);
  });

  test.for([
    ["unknown", undefined],
    ["series_b", "series_b"],
  ] as [unknown, string][])("toCompanyStage(%s) → %s", ([value, expected]) => {
    expect(toCompanyStage(value)).toBe(expected);
  });

  test.for([
    ["monthly", undefined],
    ["salary", "salary"],
  ] as [unknown, string][])("toPayCadence(%s) → %s", ([value, expected]) => {
    expect(toPayCadence(value)).toBe(expected);
  });

  test.for([
    [150000, "USD", undefined, /\$150K|\$150,000/],
    [80000, undefined, "Pay: ", /Pay: 80,000/],
    [5000, undefined, undefined, /5,000/],
    [1000, "FAKE" as never, undefined, /1,000/],
  ] as [...Parameters<typeof toCurrencyFormat>, RegExp][])(
    "toCurrencyFormat(%s, %s, %s) → %s",
    ([value, currency, prefix, expected]) => {
      const result = toCurrencyFormat(value, currency, prefix);
      expect(result).toMatch(expected);
    },
  );
});
