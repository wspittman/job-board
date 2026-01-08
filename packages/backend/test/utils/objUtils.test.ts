import assert from "node:assert/strict";
import { suite, test } from "node:test";

import { stripObj } from "../../src/utils/objUtils.ts";

type StripCase = {
  name: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
};

suite("stripObj", () => {
  test("removes only null and undefined values", () => {
    const cases: StripCase[] = [
      {
        name: "keeps falsy primitives",
        input: { enabled: false, count: 0, label: "", skip: null },
        expected: { enabled: false, count: 0, label: "" },
      },
      {
        name: "drops undefined and null properties",
        input: { title: "Role", notes: undefined, details: null },
        expected: { title: "Role" },
      },
      {
        name: "preserves nested object values",
        input: { meta: { note: null }, value: undefined },
        expected: { meta: { note: null } },
      },
    ];

    cases.forEach(({ name, input, expected }) => {
      assert.deepEqual(stripObj(input), expected, name);
    });
  });
});
