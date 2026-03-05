import assert from "node:assert/strict";
import { mock, suite, test } from "node:test";
import { llm } from "../../src/ai/llm.ts";
import { interpretQuery } from "../../src/controllers/interpret.ts";
import type { Filters, InterpretQuery } from "../../src/models/clientModels.ts";

suite("interpretQuery controller", () => {
  test("calls llm.fillFilters and returns results", async () => {
    const mockFilters: Filters = { title: "Software Engineer", isRemote: true };
    const fillFiltersMock = mock.method(
      llm,
      "fillFilters",
      async () => mockFilters,
    );

    const request: InterpretQuery = {
      query: "Remote software engineer",
      filters: { location: "Berlin" },
    };

    const result = await interpretQuery(request);

    assert.equal(fillFiltersMock.mock.callCount(), 1);
    assert.equal(result.title, "Software Engineer");
    assert.equal(result.isRemote, true);

    fillFiltersMock.mock.restore();
  });

  test("transforms LLM output into standard Filters", async () => {
    const mockFilters: Filters = {
      isRemote: true,
      location: "San Francisco, CA, United States (US)",
      title: "Fullstack",
    };

    const fillFiltersMock = mock.method(
      llm,
      "fillFilters",
      async () => mockFilters,
    );

    const request: InterpretQuery = { query: "Remote jobs in SF" };
    const result = await interpretQuery(request);

    assert.equal(result.isRemote, true);
    assert.equal(result.location, "San Francisco, CA, United States (US)");
    assert.equal(result.title, "Fullstack");

    fillFiltersMock.mock.restore();
  });
});
