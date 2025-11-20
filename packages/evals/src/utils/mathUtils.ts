import { kmeans } from "ml-kmeans";
import type { NumBag } from "../types/types.ts";

export function addNumBags<T extends NumBag>(acc: T, b: T): T {
  for (const key in b) {
    acc[key] = ((acc[key] ?? 0) + (b[key] ?? 0)) as T[Extract<keyof T, string>];
  }
  return acc;
}

export function truncate(n: number, digits: number = 4): number {
  return Number(n.toFixed(digits));
}

export function calcF1(precision: number, recall: number): number {
  return truncate((2 * (precision * recall)) / (precision + recall || 1));
}

export function cost(
  inTokens: number,
  outTokens: number,
  inCost: number,
  outCost: number
) {
  return truncate(
    // Cost is per million tokens
    (inTokens * inCost) / 1_000_000 + (outTokens * outCost) / 1_000_000,
    8
  );
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
    0
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
 * @returns The centroid vector.
 */
export function computeClusters(vecList: number[][], k: number) {
  if (!vecList.length) return { clusters: [], centroids: [] };

  const { clusters, centroids } = kmeans(vecList, k, {});
  return { clusters, centroids };
}
