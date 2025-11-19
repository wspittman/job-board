import { embedCache } from "./src/utils/embedCache.ts";
import { readObj, writeObj } from "./src/utils/fileUtils.ts";
import {
  computeCentroid,
  cosineDistanceAll,
  cosineSimilarity,
  truncate,
} from "./src/utils/mathUtils.ts";

interface GeneralInterestInput {
  train: string[];
  testPos: string[];
  testNeg: string[];
}

async function readInput() {
  const { train, testPos, testNeg } =
    (await readObj<GeneralInterestInput>(
      "Input",
      "playground",
      "general_interest_titles"
    )) ?? {};

  if (!train?.length || !testPos?.length || !testNeg?.length) {
    return undefined;
  }

  return { train, testPos, testNeg };
}

async function embedInput({ train, testPos, testNeg }: GeneralInterestInput) {
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

/**
 * Embeds a list of texts, computes the centroid, and measures distance from centroid.
 * `distanceFromCentroid` is defined as (1 - cosineSimilarity(embedding, centroid)).
 */
async function getCentroidDistances(texts: string[]) {
  const embeddings = await embedCache.getEmbeddings("centroid", texts);

  if (!embeddings) {
    throw new Error("Unexpected embeddings result");
  }

  const centroid = computeCentroid(embeddings);

  const distances = embeddings.map((embedding, index) => {
    const similarity = cosineSimilarity(embedding, centroid);
    const distance = 1 - similarity;
    return { text: texts[index], distance };
  });

  return { distances, centroid };
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

  const centroid = computeCentroid(train);
  const trainDistances = cosineDistanceAll(centroid, train);
  const posDistances = cosineDistanceAll(centroid, testPos);
  const negDistances = cosineDistanceAll(centroid, testNeg);
  const trainStats = stats(trainDistances);
  const posStats = stats(posDistances);
  const negStats = stats(negDistances);

  console.log("Training Distances", trainStats);
  console.log("Pos Test Distances", posStats);
  console.log("Neg Test Distances", negStats);

  const sew = (t: string[], d: number[]) =>
    t.map((text, i) => ({ text, distance: d[i] }));

  await writeObj(
    {
      trainStats,
      posStats,
      negStats,
      train: sew(input.train, trainDistances),
      testPos: sew(input.testPos, posDistances),
      testNeg: sew(input.testNeg, negDistances),
      centroid,
    },
    "Outcome",
    "playground",
    "general_interest_titles"
  );

  await embedCache.saveCache();
}

run().catch((err) => {
  console.error("Error running playground:", err);
});
