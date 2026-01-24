import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { normTitle } from "../../src/ats/normalization.ts";

suite("normalizeJobTitle", () => {
  test("Converts all-caps titles to title case", () => {
    const cases = [
      ["SOFTWARE ENGINEER", "Software Engineer"],
      ["SENIOR QA/DEVOPS ENGINEER", "Senior QA/Devops Engineer"],
      ["DATA ANALYST II", "Data Analyst II"],
      ["  PRODUCT MANAGER  ", "Product Manager"],
    ];

    cases.forEach(([input, expected]) => {
      assert.equal(normTitle(input), expected);
    });
  });

  test("Leaves other titles unchanged", () => {
    const cases = [
      "Software Engineer",
      "Senior QA Engineer",
      "Frontend/Backend ENGINEER",
      "12345",
      "ソフトウェアエンジニア",
    ];

    cases.forEach((input) => {
      assert.equal(normTitle(input), input);
    });
  });
});
