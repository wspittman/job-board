import assert from "node:assert/strict";
import { suite, test } from "node:test";

import type { Source } from "../../src/types/types.ts";
import { catcher } from "../../src/utils/telemetryCatcher.ts";

suite("telemetryCatcher", () => {
  test("createMarkedInput: returns a stable 32-char hash per sourceName", () => {
    const source: Source = {
      sourceName: "scenario-1",
      input: { item: { title: "Engineer" }, extra: true },
      ground: {},
    };

    const [firstV] = catcher.createMarkedInput(source);
    const [secondV] = catcher.createMarkedInput(source);

    assert.equal(firstV, secondV);
    assert.match(firstV, /^[a-f0-9]{32}$/);
  });

  test("createMarkedInput: injects v into item while preserving sibling fields", () => {
    const source: Source = {
      sourceName: "scenario-2",
      input: { item: { title: "Designer" }, scope: "public" },
      ground: {},
    };

    const [v, marked] = catcher.createMarkedInput(source);

    assert.equal((marked.item as { v: string }).v, v);
    assert.equal((marked.item as { title: string }).title, "Designer");
    assert.equal(marked.scope, "public");
  });

  test("catch/find: stores metrics using hash extracted from dense input tag", () => {
    const source: Source = {
      sourceName: "scenario-3",
      input: { item: { title: "PM" } },
      ground: {},
    };
    const [v] = catcher.createMarkedInput(source);
    const metrics = { inTokens: 12, outTokens: 8 };

    catcher.catch(`item: ${v}, payload`, metrics);

    assert.deepEqual(catcher.find(v), metrics);
  });

  test("find: returns undefined for unknown hash", () => {
    assert.equal(catcher.find("00000000000000000000000000000000"), undefined);
  });
});
