import assert from "node:assert/strict";
import { suite, test } from "node:test";

import type { Location } from "../../src/models/models.ts";
import { normalizedLocation } from "../../src/utils/location.ts";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

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
        name: "returns country display name with code",
        input: { countryCode: "US" },
        expected: `${displayNames.of("US")} (US)`,
      },
      {
        name: "returns full location when all parts are provided",
        input: { city: "Seattle", regionCode: "WA", countryCode: "US" },
        expected: `Seattle, WA, ${displayNames.of("US")} (US)`,
      },
    ];

    cases.forEach(({ name, input, expected }) => {
      assert.equal(normalizedLocation(input), expected, name);
    });
  });
});
