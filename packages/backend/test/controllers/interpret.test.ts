import assert from "node:assert/strict";
import { mock, suite, test } from "node:test";
import { llm } from "../../src/ai/llm.ts";
import { interpretFilters } from "../../src/controllers/interpret.ts";
import type { Filters } from "../../src/models/clientModels.ts";

suite("interpretFilters controller", () => {
  test("calls llm.interpretFilters and returns results", async () => {
    const mockFilters: Filters = {
      title: "Software Engineer",
      isRemote: true,
      city: "Seattle",
    };
    const interpretFiltersMock = mock.method(
      llm,
      "interpretFilters",
      async () => mockFilters,
    );

    const query = "Remote software engineer";

    const result = await interpretFilters(query);

    assert.equal(interpretFiltersMock.mock.callCount(), 1);
    assert.equal(result.title, "Software Engineer");
    assert.equal(result.isRemote, true);
    assert.equal(result.city, "Seattle");

    interpretFiltersMock.mock.restore();
  });

  test("transforms LLM output into standard Filters", async () => {
    const mockFilters: Filters = {
      isRemote: true,
      city: "San Francisco",
      state: "CA",
      title: "Fullstack",
    };

    const interpretFiltersMock = mock.method(
      llm,
      "interpretFilters",
      async () => mockFilters,
    );

    const query = "Remote jobs in SF";
    const result = await interpretFilters(query);

    assert.equal(result.isRemote, true);
    assert.equal(result.city, "San Francisco");
    assert.equal(result.state, "CA");
    assert.equal(result.title, "Fullstack");

    interpretFiltersMock.mock.restore();
  });
});
