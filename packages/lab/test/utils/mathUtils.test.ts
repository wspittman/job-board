import assert from "node:assert/strict";
import { suite, test } from "node:test";

import {
  addNumBags,
  calcF1,
  computeClusters,
  cosineDistanceAll,
  cosineSimilarity,
  cost,
  truncate,
} from "../../src/utils/mathUtils.ts";

suite("addNumBags", () => {
  test("adds matching keys and handles missing values", () => {
    const base = { total: 2, pass: 1, skip: 0 };
    const toAdd = { total: 3, fail: 4 };

    const out = addNumBags(base, toAdd as unknown as typeof base);

    assert.equal(out, base);
    assert.deepEqual(out, { total: 5, pass: 1, skip: 0, fail: 4 });
  });
});

suite("truncate", () => {
  test("rounds to four digits by default", () => {
    assert.equal(truncate(1.234567), 1.2346);
  });

  test("rounds to a provided number of digits", () => {
    assert.equal(truncate(9.87654, 2), 9.88);
  });
});

suite("calcF1", () => {
  test("returns rounded harmonic mean", () => {
    assert.equal(calcF1(0.5, 0.75), 0.6);
  });

  test("returns zero when precision and recall are zero", () => {
    assert.equal(calcF1(0, 0), 0);
  });
});

suite("cost", () => {
  test("calculates million-token scaled and rounded cost", () => {
    assert.equal(cost(1_000_000, 500_000, 2.5, 10), 7.5);
  });

  test("supports tiny values via 8-digit precision", () => {
    assert.equal(cost(100, 100, 0.1, 0.2), 0.00003);
  });
});

suite("cosineSimilarity", () => {
  test("returns 1 for identical vectors", () => {
    assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
  });

  test("treats missing values in the second vector as zero", () => {
    assert.equal(cosineSimilarity([1, 2], [1]), 1 / Math.sqrt(5));
  });
});

suite("cosineDistanceAll", () => {
  test("returns distance for each vector", () => {
    const distances = cosineDistanceAll(
      [1, 0],
      [
        [1, 0],
        [0, 1],
        [-1, 0],
      ],
    );

    assert.deepEqual(distances, [0, 1, 2]);
  });
});

suite("computeClusters", () => {
  test("returns empty structures when there are no vectors", () => {
    assert.deepEqual(computeClusters([], 3), { clusters: [], centroids: [] });
  });

  test("computes expected number of clusters and centroids", () => {
    const vectors = [
      [0, 0],
      [0.1, 0.2],
      [9.8, 10],
      [10, 9.9],
    ];

    const { clusters, centroids } = computeClusters(vectors, 2);

    assert.equal(clusters.length, vectors.length);
    assert.equal(centroids.length, 2);
    centroids.forEach((centroid) => {
      assert.equal(centroid.length, 2);
    });
  });
});
