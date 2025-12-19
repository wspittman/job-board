import assert from "node:assert/strict";
import { beforeEach, suite, test } from "node:test";
import { LRUCache } from "../../src/db/lruCache.ts";

suite("LRUCache", () => {
  const cache = new LRUCache<string, number>(2);

  beforeEach(() => {
    cache.clear();
  });

  const invalidSizeCases = [
    { name: "zero", size: 0 },
    { name: "negative", size: -1 },
  ];

  invalidSizeCases.forEach(({ name, size }) => {
    test(`Invalid size: ${name}`, () => {
      assert.throws(
        () => new LRUCache(size),
        /Cache size must be greater than 0/,
      );
    });
  });

  function validateContent(
    size: number,
    expected: Record<string, number | undefined>,
  ) {
    assert.equal(cache.size(), size);
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(cache.get(key), value);
    }
  }

  test("Stores and retrieves values", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    validateContent(2, { a: 1, b: 2, c: undefined });
  });

  test("Updates existing entries without growing size", () => {
    cache.set("a", 1);
    cache.set("a", 2);
    validateContent(1, { a: 2 });
  });

  test("Evicts the least recently used entry", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    validateContent(2, { a: undefined, b: 2, c: 3 });
  });

  test("Treats reads as most recently used", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // Access 'a' to mark it as recently used
    cache.set("c", 3);
    validateContent(2, { a: 1, b: undefined, c: 3 });
  });

  test("Treats updates as most recently used", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 3); // Update 'a' to mark it as recently used
    cache.set("c", 3);
    validateContent(2, { a: 3, b: undefined, c: 3 });
  });

  test("Deletes entries by key", () => {
    cache.set("a", 1);
    cache.set("b", 2);

    assert.equal(cache.delete("a"), true);
    validateContent(1, { a: undefined, b: 2 });

    assert.equal(cache.delete("missing"), false);
    validateContent(1, { a: undefined, b: 2 });
  });
});
