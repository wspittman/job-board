import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { normTitle } from "../../src/ats/normalization.ts";

suite("normalization", () => {
  const allCapsTitleCases = [
    ["SOFTWARE ENGINEER", "Software Engineer"],
    ["SENIOR QA/DEVOPS ENGINEER", "Senior QA/Devops Engineer"],
    ["DATA ANALYST II", "Data Analyst II"],
    ["  PRODUCT MANAGER  ", "Product Manager"],
  ];

  allCapsTitleCases.forEach(([input, expected]) => {
    test(`normTitle: Converts all-caps title to title case: ${input}`, () => {
      assert.equal(normTitle(input), expected);
    });
  });

  const unchangedTitleCases = [
    "Software Engineer",
    "Senior QA Engineer",
    "Frontend/Backend ENGINEER",
    "12345",
    "ソフトウェアエンジニア",
  ];

  unchangedTitleCases.forEach((input) => {
    test(`normTitle: Leaves title unchanged: ${input}`, () => {
      assert.equal(normTitle(input), input);
    });
  });
});
