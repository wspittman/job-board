import assert from "node:assert/strict";
import { suite, test } from "node:test";

import {
  computeClusters,
  cosineDistanceAll,
  cosineSimilarity,
  truncate,
} from "../../src/utils/mathUtils.ts";

suite("mathUtils", () => {
  test("truncate: rounds to four digits by default", () => {
    assert.equal(truncate(1.234567), 1.2346);
  });

  test("truncate: rounds to a provided number of digits", () => {
    assert.equal(truncate(9.87654, 2), 9.88);
  });

  test("cosineSimilarity: returns 1 for identical vectors", () => {
    assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
  });

  test("cosineSimilarity: treats missing values in the second vector as zero", () => {
    assert.equal(cosineSimilarity([1, 2], [1]), 1 / Math.sqrt(5));
  });

  test("cosineDistanceAll: returns distance for each vector", () => {
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

  test("computeClusters: returns empty structures when there are no vectors", () => {
    assert.deepEqual(computeClusters([], 3), { clusters: [], centroids: [] });
  });

  test("computeClusters: computes expected number of clusters and centroids", () => {
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
