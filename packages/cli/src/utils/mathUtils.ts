import { kmeans } from "ml-kmeans";
import type { NumBag } from "../types.ts";

export function addNumBags<T extends NumBag>(acc: T, b: T): T {
  for (const key in b) {
    acc[key] = ((acc[key] ?? 0) + (b[key] ?? 0)) as T[Extract<keyof T, string>];
  }
  return acc;
}

export function calcF1(precision: number, recall: number): number {
  return truncate((2 * (precision * recall)) / (precision + recall || 1));
}

export function truncate(n: number, digits: number = 4): number {
  return Number(n.toFixed(digits));
}

/**
 * Calculates the cosine similarity between two embeddings (normalized vectors).
 * @param embA The first embedding.
 * @param embB The second embedding.
 * @returns The cosine similarity score, a value between -1 and 1 (typically 0 to 1 for positive embeddings).
 */
export function cosineSimilarity(embA: number[], embB: number[]): number {
  const dotProduct = embA.reduce(
    (sum, val, i) => sum + val * (embB[i] ?? 0),
    0,
  );

  // OpenAI and Gemini both normalize embeddings to unit length,
  // This means we can skip dividing by magnitudes for efficiency.
  // const magnitudeA = Math.sqrt(embA.reduce((sum, val) => sum + val ** 2, 0));
  // const magnitudeB = Math.sqrt(embB.reduce((sum, val) => sum + val ** 2, 0));
  // return dotProduct / (magnitudeA * magnitudeB);

  return dotProduct;
}

/**
 * Calculates the cosine distance between an embedding (normalized vector) and a list of embeddings.
 * Cosine distance is defined as (1 - cosine similarity).
 */
export function cosineDistanceAll(emb: number[], embAr: number[][]): number[] {
  return embAr.map((v) => 1 - cosineSimilarity(emb, v));
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
