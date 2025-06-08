import axios from "axios";

type ConditionFunc = (actual: unknown, ground: unknown) => Promise<number>;
type Condition = [string, ConditionFunc];

/**
 * A record mapping action names to an array of conditions.
 * Each condition specifies a property to check and a function to evaluate its correctness.
 */
export const rubrics: Record<string, Condition[]> = {
  fillCompanyInfo: [
    ["website", equals],
    ["industry", equals],
    ["foundingYear", equals],
    ["size", equals],
    ["stage", equals],
    ["visa", equals],
    ["description", similar],
  ],
};

/**
 * Checks if the actual value is strictly equal to the ground truth value.
 */
async function equals(actual: unknown, ground: unknown): Promise<number> {
  return actual === ground ? 1 : 0;
}

/**
 * Checks if the actual string value is semantically similar to the ground truth string value
 * using cosine similarity of their embeddings.
 * @param actual The actual value, converted to a string.
 * @param ground The ground truth value, converted to a string.
 * @returns A similarity score between 0 and 1.
 */
async function similar(actual: unknown, ground: unknown): Promise<number> {
  const actualEmb = await getEmbedding(String(actual));
  const groundEmb = await getEmbedding(String(ground));
  // If either embedding failed, return 0 similarity.
  const eitherFails = !actualEmb.length || !groundEmb.length;
  return eitherFails ? 0 : cosineSimilarity(actualEmb, groundEmb);
}

/**
 * Fetches text embeddings from the OpenAI API.
 * TODO: This should be available through dry-utils/openai.
 * TODO: Implement caching for embeddings to reduce API calls and costs.
 * @param input The string to get an embedding for.
 * @returns An array of numbers representing the embedding, or an empty array on failure.
 */
async function getEmbedding(input: string): Promise<number[]> {
  //TBD: Caching
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
