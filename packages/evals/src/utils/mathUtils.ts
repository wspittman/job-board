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
 * Computes the centroid (average vector) of a list of vectors.
 * @param vecList List of vectors (arrays of numbers).
 * @returns The centroid vector.
 */
export function computeCentroid(vecList: number[][]): number[] {
  if (!vecList.length) return [];

  const dim = vecList[0]!.length;
  const centroid = new Array<number>(dim).fill(0);

  for (const emb of vecList) {
    for (let i = 0; i < dim; i++) {
      centroid[i]! += emb[i]!;
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i]! /= vecList.length;
  }

  return centroid;
}
