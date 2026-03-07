import path from "node:path";

const reasoningEffortOptions = ["minimal", "low", "medium", "high"] as const;
type ReasoningEffort = (typeof reasoningEffortOptions)[number];
function isReasoningEffort(val?: string): val is ReasoningEffort {
  return !!val && reasoningEffortOptions.includes(val as ReasoningEffort);
}
function isRecord(val: unknown): val is Record<string, string> {
  return (
    !!val &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    Object.values(val).every((x) => typeof x === "string")
  );
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
  LLM_MODEL_OVERRIDES: Record<string, string>;
  LLM_REASONING_EFFORT_OVERRIDES: Record<string, ReasoningEffort>;

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
    throw new Error(`Env: ${key} is required but not set.`);
  }
  return val;
};

const getFlag = (key: KEY): boolean => getEnv(key)?.toLowerCase() === "true";

const getBag = <T>(key: KEY, mutate: (x: string) => T): Record<string, T> => {
  const val = getEnv(key);
  if (!val) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(val) as unknown;
  } catch {
    throw new Error(`Env: ${key} must be JSON string.`);
  }

  if (!isRecord(parsed)) {
    throw new Error(`Env: ${key} must be a JSON Record<string, string>.`);
  }

  const result: Record<string, T> = {};
  for (const key in parsed) {
    result[key] = mutate(parsed[key]!);
  }
  return result;
};

const adminToken = getReqEnv("ADMIN_TOKEN");

if (adminToken.length < 16) {
  throw new Error("ADMIN_TOKEN must be at least 16 characters long.");
}

const reasoning = getEnv("LLM_REASONING_EFFORT")?.toLowerCase();
const reasoningEffort = isReasoningEffort(reasoning) ? reasoning : undefined;

const modelOverrides = getBag("LLM_MODEL_OVERRIDES", (val) =>
  val.toLowerCase(),
);

const reasoningOverrides = getBag("LLM_REASONING_EFFORT_OVERRIDES", (val) => {
  const v = val.toLowerCase();
  if (!isReasoningEffort(v)) {
    throw new Error(`Env: LLM_REASONING_EFFORT_OVERRIDES invalid value ${val}`);
  }
  return v;
});

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
  LLM_MODEL_OVERRIDES: modelOverrides,
  LLM_REASONING_EFFORT_OVERRIDES: reasoningOverrides,

  // Auth configs
  ADMIN_TOKEN: adminToken,

  // App Insights configs
  // In theory App Insights SDK should pick up this env var automatically, but it doesn't
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    getEnv("APPLICATIONINSIGHTS_CONNECTION_STRING") ?? "",
  ENABLE_VERBOSE_BLOB_LOGGING: getFlag("ENABLE_VERBOSE_BLOB_LOGGING"),
};

/**
 * Gets the common LLM options for jsonCompletion.
 * @param opName - Operation name.
 * @returns An object with model and reasoningEffort.
 */
export function getLLMOptions(opName: string) {
  if (!opName) {
    throw new Error("Operation name is required.");
  }

  return {
    model: config.LLM_MODEL_OVERRIDES[opName] || config.LLM_MODEL,
    reasoningEffort:
      config.LLM_REASONING_EFFORT_OVERRIDES[opName] ||
      config.LLM_REASONING_EFFORT,
  };
}
