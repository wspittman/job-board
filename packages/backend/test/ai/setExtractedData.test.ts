import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { setExtractedData } from "../../src/ai/setExtractedData.ts";

suite("setExtractedData", () => {
  test("assigns cleaned completion data", () => {
    const item = {
      title: "Old",
      meta: { keep: true },
      tags: ["existing"],
    };
    const completion = {
      title: " New ",
      location: "null",
      count: -1,
      meta: {
        level: "Senior",
        empty: " ",
        nested: {
          a: null,
          b: "value",
        },
      },
      tags: ["", " Remote ", null, "undefined", 0, -1, "ok"],
      flags: [false, true],
    };

    setExtractedData(item, completion);

    assert.deepEqual(item, {
      title: "New",
      meta: {
        level: "Senior",
        nested: {
          b: "value",
        },
      },
      tags: ["Remote", "ok"],
      flags: [true],
    });
  });

  test("leaves item untouched when completion removes to undefined", () => {
    const item = {
      title: "Keep",
      meta: { keep: true },
    };
    const completion = {
      title: "",
      count: -1,
      meta: {
        note: "undefined",
      },
    };

    setExtractedData(item, completion);

    assert.deepEqual(item, {
      title: "Keep",
      meta: { keep: true },
    });
  });

  test("replaces top-level objects rather than deep merge", () => {
    const item = {
      meta: {
        a: "old",
        b: "keep",
      },
    };
    const completion = {
      meta: {
        a: "new",
      },
    };

    setExtractedData(item, completion);

    assert.deepEqual(item, {
      meta: {
        a: "new",
      },
    });
  });
});
