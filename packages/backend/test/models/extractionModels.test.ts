import assert from "node:assert/strict";
import { suite, test } from "node:test";

import { ExtractionFilters } from "../../src/models/extractionModels.ts";

suite("ExtractionFilters", () => {
  test("describes title as word-based matching", () => {
    assert.equal(
      ExtractionFilters.shape.title.description,
      "Words from the user's search that should match the job title. Every word must match, but the order does not matter.",
    );
  });

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
    assert.equal("currency" in result.data, false);
  });
});
