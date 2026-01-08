interface Config {
  PROD_API_BASE_URL: string;
  PROD_API_TOKEN: string;
  LOCAL_API_BASE_URL: string;
  LOCAL_API_TOKEN: string;
  GREENHOUSE_IDS: string[];
  LEVER_IDS: string[];
}

const DEFAULT_PROD_API = "https://api.betterjobboard.net/api/";
const DEFAULT_LOCAL_API = "http://localhost:3000/api/";

const prep = (key: keyof Config) => process.env[key]?.trim() ?? "";
const normUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);
const toArr = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/**
 * CLI configuration derived from environment variables.
 */
export const config: Config = {
  PROD_API_BASE_URL: normUrl(prep("PROD_API_BASE_URL") || DEFAULT_PROD_API),
  PROD_API_TOKEN: prep("PROD_API_TOKEN") || "unset",

  LOCAL_API_BASE_URL: normUrl(prep("LOCAL_API_BASE_URL") || DEFAULT_LOCAL_API),
  LOCAL_API_TOKEN: prep("LOCAL_API_TOKEN") || "unset",

  GREENHOUSE_IDS: toArr(prep("GREENHOUSE_IDS")),
  LEVER_IDS: toArr(prep("LEVER_IDS")),
};
