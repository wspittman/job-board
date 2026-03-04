import assert from "node:assert/strict";
import { mock, suite, test } from "node:test";
import { interpretQuery } from "../../src/controllers/interpret.ts";
import { llm } from "../../src/ai/llm.ts";

suite("interpretQuery controller", () => {
  test("calls llm.fillFilters and returns results", async () => {
    const mockFilters = { title: "Software Engineer", isRemote: true };
    const fillFiltersMock = mock.method(llm, "fillFilters", async () => mockFilters);

    const request = {
      query: "Remote software engineer",
      filters: { location: "Berlin" },
    };

    const result = await interpretQuery(request);

    assert.strictEqual(fillFiltersMock.mock.callCount(), 1);
    assert.deepEqual(fillFiltersMock.mock.calls[0].arguments[0], request);
    assert.deepEqual(result, mockFilters);
    
    fillFiltersMock.mock.restore();
  });
});
