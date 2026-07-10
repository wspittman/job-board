import assert from "node:assert/strict";
import { suite, test } from "node:test";

import { ExtractionFilters } from "../../src/models/extractionModels.ts";

suite("ExtractionFilters", () => {
  test("does not include unsupported currency filter", () => {
    const result = ExtractionFilters.safeParse({
      isRemote: "",
      workTimeBasis: "",
      jobFamily: "",
      companyStage: "",
      payCadence: "",
      currency: "EUR",
      title: "",
      city: "",
      state: "",
      daysSince: -1,
      maxExperience: -1,
      minSalary: -1,
      unmappedIntent: "EUR salary preference is unsupported",
    });

    assert.equal(result.success, true);
    if (!result.success) throw result.error;
    assert.equal("currency" in result.data, false);
  });
});
