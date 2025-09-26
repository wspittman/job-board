import axios from "axios";

export interface MatchResult {
  // 0..1, only present for fuzzy matches
  score?: number;
  match?: boolean;
  badMatch?: boolean;
  badFind?: boolean;
  badOmit?: boolean;
}

export type MatchFunction = (
  actual: unknown,
  expected: unknown
) => Promise<MatchResult>;

/**
 * Checks if the actual value is strictly equal to the ground truth value.
 */
export async function equals(
  actual: unknown,
  expected: unknown
): Promise<MatchResult> {
  const undef = undefinedCheck(actual, expected);
  if (undef) return undef;

  const ok = actual === expected;

  return { match: ok, badMatch: !ok };
}

export async function equalsCaseInsensitive(
  actual: unknown,
  expected: unknown
): Promise<MatchResult> {
  const undef = undefinedCheck(actual, expected);
  if (undef) return undef;

  const ok = isEqualCaseInsensitive(actual, expected);

  return { match: ok, badMatch: !ok };
}

export async function equalsCasePreferred(
  actual: unknown,
  expected: unknown
): Promise<MatchResult> {
  const undef = undefinedCheck(actual, expected);
  if (undef) return undef;

  if (actual === expected) {
    return { match: true };
  }

  if (!isEqualCaseInsensitive(actual, expected)) {
    return { badMatch: true };
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

  return { match: score >= 0.8, badMatch: score < 0.8, score };
}

/**
 * Checks if the actual string value is semantically similar to the expected string value
 * using cosine similarity of their embeddings.
 * @param actual The actual value, converted to a string.
 * @param expected The expected value, converted to a string.
 * @returns A similarity score between 0 and 1.
 */
export async function similar(
  actual: unknown,
  expected: unknown
): Promise<MatchResult> {
  const undef = undefinedCheck(actual, expected);
  if (undef) return undef;

  const actualEmb = await getEmbedding(String(actual));
  const expectedEmb = await getEmbedding(String(expected));

  // If either embedding failed, return 0 similarity.
  const eitherFails = !actualEmb.length || !expectedEmb.length;
  const score = eitherFails ? 0 : cosineSimilarity(actualEmb, expectedEmb);

  return { match: score >= 0.8, badMatch: score < 0.8, score };
}

export async function arrayExactMatcher(
  actual: unknown,
  expected: unknown
): Promise<MatchResult> {
  const undef = undefinedCheck(actual, expected);
  if (undef) return undef;

  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return { badMatch: true };
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

  const score = Math.max(1 - dist / expected.length, 0);

  return { match: score >= 0.8, badMatch: score < 0.8, score };
}

function undefinedCheck(
  actual: unknown,
  expected: unknown
): MatchResult | undefined {
  const actualFound = actual !== undefined;
  const expectedFound = expected !== undefined;

  if (actualFound && expectedFound) {
    // Need to do match comparison
    return undefined;
  }

  return {
    badOmit: expectedFound,
    badFind: actualFound,
    match: !actualFound && !expectedFound,
  };
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
