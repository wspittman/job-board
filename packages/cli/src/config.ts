interface Config {
  // API configs
  API_URL: string;
  ADMIN_TOKEN: string;

  PROD_API_URL: string;
  PROD_ADMIN_TOKEN?: string;

  // E2E test configs
  GREENHOUSE_IDS: string[];
  LEVER_IDS: string[];
}
type KEY = keyof Config;

const Defaults: Partial<Record<KEY, string>> = {
  API_URL: "http://localhost:3000/api/",
  PROD_API_URL: "https://api.betterjobboard.net/api/",
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

const normUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);
const toArr = (s: string = "") =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * CLI configuration derived from environment variables.
 */
export const config: Config = {
  API_URL: normUrl(getReqEnv("API_URL")),
  ADMIN_TOKEN: getReqEnv("ADMIN_TOKEN"),

  PROD_API_URL: normUrl(getReqEnv("PROD_API_URL")),
  PROD_ADMIN_TOKEN: getEnv("PROD_ADMIN_TOKEN"),

  GREENHOUSE_IDS: toArr(getEnv("GREENHOUSE_IDS")),
  LEVER_IDS: toArr(getEnv("LEVER_IDS")),
};
