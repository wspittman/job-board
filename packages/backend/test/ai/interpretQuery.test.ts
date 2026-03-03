import assert from "node:assert/strict";
import { test } from "node:test";
import { interpretQuery } from "../../src/ai/interpretQuery.ts";

test("interpretQuery returns hardcoded filters with optional refinement", async () => {
  const request = {
    query: "looking for remote jobs",
  };

  const result = await interpretQuery(request);

  assert.deepStrictEqual(result, {
    title: "Software Engineer",
    isRemote: true,
  });
});

test("interpretQuery merges current filters", async () => {
  const request = {
    query: "more jobs",
    filters: {
      companyStage: "series_a" as const,
    },
  };

  const result = await interpretQuery(request);

  assert.deepStrictEqual(result, {
    title: "Software Engineer",
    isRemote: true,
    companyStage: "series_a",
  });
});
