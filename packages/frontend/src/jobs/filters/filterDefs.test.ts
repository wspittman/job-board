import { expect, suite, test } from "vitest";
import { filterDefs, type FilterFieldDef } from "./filterDefs";

suite("filterDefs", () => {
  test("describes title as word-based matching", () => {
    const titleDef = filterDefs
      .flatMap(([, fields]) => fields as readonly FilterFieldDef[])
      .find(({ name }) => name === "title");

    expect(titleDef).toMatchObject({
      tooltip:
        "Search job titles using one or more words. Every word must match, but the order does not matter.",
    });
  });
});
