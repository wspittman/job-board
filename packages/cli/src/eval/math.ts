/**
 * Builds deterministic numeric vectors from strings.
 */
function pseudoEmbed(text: string): number[] {
  const seed = Array.from(text).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return [
    (seed % 101) / 100,
    ((seed * 3) % 113) / 100,
    ((seed * 7) % 127) / 100,
    ((seed * 11) % 131) / 100,
  ];
}

/**
 * Computes kmeans clusters using lightweight pseudo-embeddings.
 */
export function computeKMeans(
  values: string[],
  k: number,
): {
  clusters: number[];
  centroids: number[][];
} {
  const vectors = values.map((value) => pseudoEmbed(value));
  const centroids = vectors.slice(0, Math.max(1, Math.min(k, vectors.length)));
  const clusters = vectors.map((vector) => {
    const distances = centroids.map((centroid) =>
      cosineDistance(vector, centroid),
    );
    const nearest = distances.reduce(
      (best, value, index) => (value < distances[best] ? index : best),
      0,
    );
    return nearest;
  });

  return {
    clusters,
    centroids,
  };
}

/**
 * Computes cosine distance from one vector to many vectors.
 */
export function cosineDistanceAll(
  base: number[],
  vectors: number[][],
): number[] {
  return vectors.map((vector) => cosineDistance(base, vector));
}

function cosineDistance(a: number[], b: number[]): number {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (magA === 0 || magB === 0) {
    return 1;
  }
  return 1 - dot / (magA * magB);
}

/**
 * Truncates values for compact logs and artifacts.
 */
export function truncate(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.trunc(value * factor) / factor;
}
