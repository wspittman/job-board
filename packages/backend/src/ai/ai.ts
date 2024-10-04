import { AzureOpenAI } from "openai";
import { config } from "../config";

const client = new AzureOpenAI({
  endpoint: config.OPENAI_ENDPOINT,
  apiKey: config.OPENAI_API_KEY,
  apiVersion: config.OPENAI_API_VERSION,
  deployment: config.OPENAI_MODEL,
});

export async function test() {
  const f = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: "What is the capital of Alaska?",
      },
    ],
    model: "gpt-4o-mini",
  });
  console.log(f.choices[0].message.content);
}
