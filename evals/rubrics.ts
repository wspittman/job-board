import axios from "axios";

type ConditionFunc = (actual: unknown, ground: unknown) => Promise<number>;
type Condition = [string, ConditionFunc];

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

async function equals(actual: unknown, ground: unknown): Promise<number> {
  return actual === ground ? 1 : 0;
}

async function similar(actual: unknown, ground: unknown): Promise<number> {
  const actualEmb = await getEmbedding(String(actual));
  const groundEmb = await getEmbedding(String(ground));
  const eitherFails = !actualEmb.length || !groundEmb.length;
  return eitherFails ? 0 : cosineSimilarity(actualEmb, groundEmb);
}

// This should be available through dry-utils/openai
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

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}
