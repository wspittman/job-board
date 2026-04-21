import { kmeans } from "ml-kmeans";

export function truncate(n: number, digits: number = 4): number {
  return Number(n.toFixed(digits));
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The cosine similarity score, a value between -1 and 1 (typically 0 to 1 for positive embeddings).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce(
    (sum, val, i) => sum + val * (vecB[i] ?? 0),
    0,
  );
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculates the cosine distance between a vector and a list of vectors.
 * Cosine distance is defined as (1 - cosine similarity).
 */
export function cosineDistanceAll(vec: number[], vecAr: number[][]): number[] {
  return vecAr.map((v) => 1 - cosineSimilarity(vec, v));
}

/**
 * Computes the kmeans clusters of a list of vectors.
 * @param vecList List of vectors (arrays of numbers).
 * @param k Number of clusters to compute.
 * @returns The cluster assignments and centroid vectors.
 */
export function computeClusters(vecList: number[][], k: number) {
  if (!vecList.length) return { clusters: [], centroids: [] };

  const { clusters, centroids } = kmeans(vecList, k, {});
  return { clusters, centroids };
}
