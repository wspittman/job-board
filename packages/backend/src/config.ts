import path from "node:path";

const reasoningEffortOptions = ["minimal", "low", "medium", "high"] as const;
type ReasoningEffort = (typeof reasoningEffortOptions)[number];
function isReasoningEffort(val?: string): val is ReasoningEffort {
  return !!val && reasoningEffortOptions.includes(val as ReasoningEffort);
}

interface Config {
  PORT: number;
  NODE_ENV: string;

  // Database
  DATABASE_URL: string;
  DATABASE_KEY: string;
  DATABASE_LOCAL_CERT_PATH: string;
  DATABASE_MOCK_DATA_JSON?: string;
  DATABASE_MOCK_DATA_PATH?: string;

  // ATS
  GREENHOUSE_URL: string;
  LEVER_URL: string;

  // LLM
  LLM_MODEL: string;
  LLM_REASONING_EFFORT?: ReasoningEffort;

  // Auth configs
  ADMIN_TOKEN: string;

  // App Insights
  APPLICATIONINSIGHTS_CONNECTION_STRING: string;
  ENABLE_VERBOSE_BLOB_LOGGING: boolean;
}
type KEY = keyof Config;

const Defaults: Partial<Record<KEY, string>> = {
  PORT: "3000",
  NODE_ENV: "dev",

  // Database
  DATABASE_URL: "https://localhost:8081",
  DATABASE_KEY:
    // Default key for local CosmosDB Emulator - not private
    "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
  DATABASE_LOCAL_CERT_PATH: path.resolve(process.cwd(), "cosmosdbcert.cer"),

  // ATS
  GREENHOUSE_URL: "https://boards-api.greenhouse.io/v1/boards",
  LEVER_URL: "https://api.lever.co/v0/postings",

  // LLM
  LLM_MODEL: "gpt-5-nano",
};

const getEnv = (key: KEY): string | undefined => {
  return process.env[key]?.trim() ?? Defaults[key];
};

const getReqEnv = (key: KEY): string => {
  const val = getEnv(key);
  if (!val) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return val;
};

const getFlag = (key: KEY): boolean => getEnv(key)?.toLowerCase() === "true";

const reasoning = getEnv("LLM_REASONING_EFFORT")?.toLowerCase();
const reasoningEffort = isReasoningEffort(reasoning) ? reasoning : undefined;

const adminToken = getReqEnv("ADMIN_TOKEN");

if (adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be at least 16 characters long.");
}

export const config: Config = {
  PORT: parseInt(getReqEnv("PORT"), 10),
  NODE_ENV: getReqEnv("NODE_ENV").toLowerCase(),

  // Database configs
  DATABASE_URL: getReqEnv("DATABASE_URL"),
  DATABASE_KEY: getReqEnv("DATABASE_KEY"),
  DATABASE_LOCAL_CERT_PATH: getReqEnv("DATABASE_LOCAL_CERT_PATH"),
  DATABASE_MOCK_DATA_JSON: getEnv("DATABASE_MOCK_DATA_JSON"),
  DATABASE_MOCK_DATA_PATH: getEnv("DATABASE_MOCK_DATA_PATH"),

  // ATS configs
  GREENHOUSE_URL: getReqEnv("GREENHOUSE_URL"),
  LEVER_URL: getReqEnv("LEVER_URL"),

  // AI configs
  // OPENAI_API_KEY present in .env, referenced directly in OpenAI SDK
  LLM_MODEL: getReqEnv("LLM_MODEL").toLowerCase(),
  LLM_REASONING_EFFORT: reasoningEffort,

  // Auth configs
  ADMIN_TOKEN: adminToken,

  // App Insights configs
  // In theory App Insights SDK should pick up this env var automatically, but it doesn't
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    getEnv("APPLICATIONINSIGHTS_CONNECTION_STRING") ?? "",
  ENABLE_VERBOSE_BLOB_LOGGING: getFlag("ENABLE_VERBOSE_BLOB_LOGGING"),
};
