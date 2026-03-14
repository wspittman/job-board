import assert from "node:assert/strict";
import { suite, test } from "node:test";

import { Job } from "../../src/portal/pTypes.ts";
import { Bag } from "../../src/types.ts";
import { catcher } from "../../src/utils/telemetryCatcher.ts";

suite("telemetryCatcher", () => {
  test("createMarkedInput: returns a stable 8-char hash per key", () => {
    const key = "scenario-1.json";
    const val = { item: { title: "Engineer" } as unknown as Job };

    const [firstV] = catcher.createMarkedInput(key, val);
    const [secondV] = catcher.createMarkedInput(key, val);

    assert.equal(firstV, secondV);
    assert.match(firstV, /^[a-f0-9]{8}$/);
  });

  test("createMarkedInput: injects v into item while preserving sibling fields", () => {
    const key = "scenario-2.json";
    const val = { item: { title: "Designer" } as unknown as Job };

    const [v, marked] = catcher.createMarkedInput(key, val);

    assert.ok(typeof marked === "object" && marked !== null);
    assert.equal((marked.item as { v: string }).v, v);
    assert.equal((marked.item as { title: string }).title, "Designer");
  });

  test("catch/find: stores metrics using hash extracted from dense input tag", () => {
    const key1 = "scenario-3a.json";
    const key2 = "scenario-3b.json";
    const val1 = { item: { title: "PM" } as unknown as Job };
    const val2 = "Simple string input";

    const [v1, marked1] = catcher.createMarkedInput(key1, val1);
    const [v2, marked2] = catcher.createMarkedInput(key2, val2);

    const metrics1 = { inTokens: 12, outTokens: 6 };
    const metrics2 = { inTokens: 16, outTokens: 8 };

    catcher.catch(JSON.stringify((marked1 as unknown as Bag).item), metrics1);
    catcher.catch(JSON.stringify(marked2), metrics2);

    assert.deepEqual(catcher.find(v1), metrics1);
    assert.deepEqual(catcher.find(v2), metrics2);
  });

  test("find: returns undefined for unknown hash", () => {
    assert.equal(catcher.find("00000000"), undefined);
  });
});
