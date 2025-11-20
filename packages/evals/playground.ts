import { Bag } from "./src/types/types.ts";
import { embedCache } from "./src/utils/embedCache.ts";
import { readObj, writeObj } from "./src/utils/fileUtils.ts";
import {
  computeClusters,
  cosineDistanceAll,
  truncate,
} from "./src/utils/mathUtils.ts";

interface GeneralInterest {
  train: string[];
  testPos: string[];
  testNeg: string[];
}

type VEC = number[];

const GI_FILE = "general_interest";

async function readInput() {
  const { train, testPos, testNeg } =
    (await readObj<GeneralInterest>("Input", "playground", GI_FILE)) ?? {};

  if (!train?.length || !testPos?.length || !testNeg?.length) {
    return undefined;
  }

  return { train, testPos, testNeg };
}

async function embedInput({ train, testPos, testNeg }: GeneralInterest) {
  const embeddings = await embedCache.getEmbeddings("centroid", [
    ...train,
    ...testPos,
    ...testNeg,
  ]);

  if (!embeddings) {
    return undefined;
  }

  return {
    train: embeddings.slice(0, train.length),
    testPos: embeddings.slice(train.length, train.length + testPos.length),
    testNeg: embeddings.slice(train.length + testPos.length),
  };
}

// Given a list of vectors and a clustering map, group the vectors by cluster.
function groupByCluster(texts: string[], vecAr: VEC[], clusters: number[]) {
  const groups: { texts: string[]; vecs: VEC[] }[] = [];

  for (let i = 0; i < clusters.length; i++) {
    const cN = clusters[i];
    groups[cN] ??= { texts: [], vecs: [] };
    groups[cN].texts.push(texts[i]);
    groups[cN].vecs.push(vecAr[i]);
  }

  return groups;
}

// Given a list of vectors and a list of potential centroids, return the distances to the closest centroid.
function closestDistances(vecs: VEC[], centroids: VEC[]): number[] {
  return vecs.map((vec) => {
    const distances = cosineDistanceAll(vec, centroids);
    return Math.min(...distances);
  });
}

function stats(distances: number[]) {
  const min = truncate(Math.min(...distances));
  const max = truncate(Math.max(...distances));
  const avg = truncate(
    distances.reduce((sum, d) => sum + d, 0) / (distances.length || 1)
  );
  return { min, avg, max };
}

async function run() {
  const input = await readInput();

  if (!input) {
    console.error("Failed to read acceptable input.");
    return;
  }

  const embeddings = await embedInput(input);

  if (!embeddings) {
    console.error("Unexpected embeddings result");
    return;
  }

  const { train, testPos, testNeg } = embeddings;
  const { clusters, centroids } = computeClusters(train, 5);
  const trainClusters = groupByCluster(input.train, train, clusters);

  // Get the distances and stats for each cluster.
  const clusterData = trainClusters.map(({ texts, vecs }, i) => {
    const cDistances = cosineDistanceAll(centroids[i], vecs);
    const cStats = stats(cDistances);
    return { texts, cDistances, cStats };
  });

  // For testPos/testNeg, get the lowest distance from each vector to any centroid and get stats on that.
  const posDistances = closestDistances(testPos, centroids);
  const negDistances = closestDistances(testNeg, centroids);
  const posStats = stats(posDistances);
  const negStats = stats(negDistances);

  clusterData.forEach((cs, i) =>
    console.log(`Cluster${i} Distances:`, cs.cStats)
  );
  console.log("Pos Test Distances", posStats);
  console.log("Neg Test Distances", negStats);

  const sew = (t: string[], d: number[]) =>
    t
      .map((text, i) => ({ text, distance: truncate(d[i]) }))
      .sort((a, b) => a.distance - b.distance);

  await writeObj(
    {
      ...clusterData.reduce((acc, cd, i) => {
        acc[`c${i}_Stats`] = cd.cStats;
        return acc;
      }, {} as Bag),
      posStats,
      negStats,
      ...clusterData.reduce((acc, cd, i) => {
        acc[`c${i}`] = sew(cd.texts, cd.cDistances);
        return acc;
      }, {} as Bag),
      testPos: sew(input.testPos, posDistances),
      testNeg: sew(input.testNeg, negDistances),
      centroids,
    },
    "Outcome",
    "playground",
    GI_FILE
  );

  await embedCache.saveCache();
}

run().catch((err) => {
  console.error("Error running playground:", err);
});
