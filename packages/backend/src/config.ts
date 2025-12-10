import path from "node:path";

type ReasoningEffort = "minimal" | "low" | "medium" | "high";

interface Config {
  PORT: number;
  NODE_ENV: string;

  DATABASE_URL: string;
  DATABASE_KEY: string;
  DATABASE_LOCAL_CERT_PATH: string;

  GREENHOUSE_URL: string;
  LEVER_URL: string;

  LLM_MODEL: string;
  LLM_REASONING_EFFORT?: ReasoningEffort;

  ADMIN_TOKEN: string;

  APPLICATIONINSIGHTS_CONNECTION_STRING: string;
  ENABLE_VERBOSE_BLOB_LOGGING: boolean;
}

const prep = (key: keyof Config) =>
  process.env[key]?.trim().toLowerCase() ?? "";

function isReasoningEffort(val: string): val is ReasoningEffort {
  return ["minimal", "low", "medium", "high"].includes(val as ReasoningEffort);
}

const llmReasoningEffort = prep("LLM_REASONING_EFFORT");

const adminToken = process.env["ADMIN_TOKEN"]?.trim();

if (!adminToken || adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be set and at least 16 characters long.");
}

export const config: Config = {
  PORT: parseInt(process.env["PORT"] || "3000", 10),
  NODE_ENV: prep("NODE_ENV") || "dev",

  // Database configs
  DATABASE_URL: process.env["DATABASE_URL"] || "https://localhost:8081",
  DATABASE_KEY:
    process.env["DATABASE_KEY"] ||
    // Default key for local CosmosDB Emulator - not private
    "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
  DATABASE_LOCAL_CERT_PATH:
    process.env["DATABASE_LOCAL_CERT_PATH"] ||
    path.resolve(process.cwd(), "cosmosdbcert.cer"),

  // ATS configs
  GREENHOUSE_URL:
    process.env["GREENHOUSE_URL"] ||
    "https://boards-api.greenhouse.io/v1/boards",
  LEVER_URL: process.env["LEVER_URL"] || "https://api.lever.co/v0/postings",

  // AI configs
  // OPENAI_API_KEY present in .env, referenced directly in OpenAI SDK
  LLM_MODEL: prep("LLM_MODEL") || "gpt-5-nano",
  LLM_REASONING_EFFORT: isReasoningEffort(llmReasoningEffort)
    ? llmReasoningEffort
    : undefined,

  // Auth configs
  ADMIN_TOKEN: adminToken,

  // App Insights configs
  // In theory App Insights SDK should pick up this env var automatically, but it doesn't
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    process.env["APPLICATIONINSIGHTS_CONNECTION_STRING"] || "",
  ENABLE_VERBOSE_BLOB_LOGGING:
    (prep("ENABLE_VERBOSE_BLOB_LOGGING") || "false") === "true",
};
