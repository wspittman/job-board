import axios from "axios";

export interface CheckIn {
  prop: string;
  actual: unknown;
  expected: unknown;
}

export interface CheckOut extends CheckIn {
  check: string;
  // 0-1, only present if match is present
  score?: number;
  match?: boolean;
  omit?: "good" | "badFind" | "badOmit";
}

/**
 * Checks if the actual value is strictly equal to the ground truth value.
 */
export async function equals(input: CheckIn): Promise<CheckOut> {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;
  const match = actual === expected;

  return createCheckOut(equals.name, input, { match });
}

export async function equalsCasePreferred(input: CheckIn): Promise<CheckOut> {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;

  if (actual === expected) {
    return createCheckOut(equalsCasePreferred.name, input, { match: true });
  }

  if (!isEqualCaseInsensitive(actual, expected)) {
    return createCheckOut(equalsCasePreferred.name, input, { match: false });
  }

  const actualStr = String(actual);
  const expectedStr = String(expected);

  let dist = 0;
  for (let i = 0; i < expectedStr.length; i++) {
    if (expectedStr[i] !== actualStr[i]) {
      dist++;
    }
  }

  const score = 1 - dist / expectedStr.length;

  return createCheckOut(equalsCasePreferred.name, input, { score });
}

/**
 * Checks if the actual string value is semantically similar to the expected string value
 * using cosine similarity of their embeddings.
 * @param actual The actual value, converted to a string.
 * @param expected The expected value, converted to a string.
 * @returns A similarity score between 0 and 1.
 */
export async function similar(input: CheckIn): Promise<CheckOut> {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;
  const actualEmb = await getEmbedding(String(actual));
  const expectedEmb = await getEmbedding(String(expected));

  // If either embedding failed, return 0 similarity.
  const eitherFails = !actualEmb.length || !expectedEmb.length;
  const score = eitherFails ? 0 : cosineSimilarity(actualEmb, expectedEmb);

  return createCheckOut(similar.name, input, { score });
}

export async function arrayExactMatcher(input: CheckIn): Promise<CheckOut> {
  const undef = omit(input);
  if (undef) return undef;

  const { actual, expected } = input;

  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return createCheckOut(arrayExactMatcher.name, input, { match: false });
  }

  const actualObj: Record<string, number> = {};

  for (const item of actual) {
    const str = String(item);
    actualObj[str] = (actualObj[str] ?? 0) + 1;
  }

  let dist = 0;
  for (const item of expected) {
    const str = String(item);
    if (!actualObj[str]) {
      dist++;
    } else {
      actualObj[str]--;
    }
  }

  dist += Object.values(actualObj).reduce((sum, v) => sum + Math.max(v, 0), 0);

  const score = Math.max(1 - dist / expected.length, 0);

  return createCheckOut(arrayExactMatcher.name, input, { score });
}

function omit(input: CheckIn): CheckOut | undefined {
  const { actual, expected } = input;
  const actualFound = actual !== undefined;
  const expectedFound = expected !== undefined;

  if (actualFound && expectedFound) {
    // Need to do match comparison
    return undefined;
  }

  return {
    check: omit.name,
    omit: expectedFound ? "badOmit" : actualFound ? "badFind" : "good",
    ...input,
  };
}

function createCheckOut(
  check: string,
  input: CheckIn,
  { score, match }: Partial<CheckOut>
): CheckOut {
  const isScoreMatch = (score ?? 0) >= 0.8;
  match = match ?? isScoreMatch;
  score = score ?? (match ? 1 : 0);

  return { check, score, match, ...input };
}

function isEqualCaseInsensitive(a: unknown, b: unknown): boolean {
  const aStr = typeof a === "string" ? a.toLowerCase() : a;
  const bStr = typeof b === "string" ? b.toLowerCase() : b;
  return aStr === bStr;
}

/**
 * Fetches text embeddings from the OpenAI API.
 * TODO: This should be available through dry-utils/openai.
 * TODO: Implement caching for embeddings to reduce API calls and costs.
 * @param input The string to get an embedding for.
 * @returns An array of numbers representing the embedding, or an empty array on failure.
 */
async function getEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env["OPENAI_API_KEY"];
  const body = { input, model: "text-embedding-3-small" };

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (err) {
    console.error("Error calling OpenAI embeddings API:", err);
    return [];
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The cosine similarity score, a value between -1 and 1 (typically 0 to 1 for positive embeddings).
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}
