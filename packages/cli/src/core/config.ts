interface Config {
  PROD_API_BASE_URL: string;
  PROD_API_TOKEN: string;
  LOCAL_API_BASE_URL: string;
  LOCAL_API_TOKEN: string;
  CLI_ALLOW_PROD: boolean;
}

const DEFAULT_PROD_API = "https://api.betterjobboard.net/api/";
const DEFAULT_LOCAL_API = "http://localhost:3000/api/";

const prep = (key: keyof Config) => process.env[key]?.trim() ?? "";
const normUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

/**
 * Runtime configuration for the CLI.
 */
export const config: Config = {
  PROD_API_BASE_URL: normUrl(prep("PROD_API_BASE_URL") || DEFAULT_PROD_API),
  PROD_API_TOKEN: prep("PROD_API_TOKEN") || "unset",
  LOCAL_API_BASE_URL: normUrl(prep("LOCAL_API_BASE_URL") || DEFAULT_LOCAL_API),
  LOCAL_API_TOKEN: prep("LOCAL_API_TOKEN") || "unset",
  CLI_ALLOW_PROD: prep("CLI_ALLOW_PROD").toLowerCase() === "true",
};
