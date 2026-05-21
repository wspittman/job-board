import assert from "node:assert/strict";
import { suite, test } from "node:test";

import type { Location } from "../../src/models/models.ts";
import { normalizedLocation } from "../../src/utils/location.ts";

type LocationCase = {
  name: string;
  input: Location;
  expected: string;
};

suite("normalizedLocation", () => {
  test("formats locations with optional parts", () => {
    const cases: LocationCase[] = [
      {
        name: "returns empty string when no fields are present",
        input: {},
        expected: "",
      },
      {
        name: "returns city only when provided",
        input: { city: "Seattle" },
        expected: "Seattle",
      },
      {
        name: "returns city and region when both are provided",
        input: { city: "Seattle", regionCode: "WA" },
        expected: "Seattle, WA",
      },
      {
        name: "omits country when country code is the only field",
        input: { countryCode: "US" },
        expected: "",
      },
      {
        name: "omits country code when all parts are provided",
        input: { city: "Seattle", regionCode: "WA", countryCode: "US" },
        expected: "Seattle, WA",
      },
    ];

    cases.forEach(({ name, input, expected }) => {
      assert.equal(normalizedLocation(input), expected, name);
    });
  });
});
