interface Config {
  PROD_API_BASE_URL: string;
  PROD_API_TOKEN: string;
  LOCAL_API_BASE_URL: string;
  LOCAL_API_TOKEN: string;
}

const DEFAULT_PROD_API = "https://api.betterjobboard.net/api/";
const DEFAULT_LOCAL_API = "http://localhost:3000/api/";

const trim = (s?: string, fallback = ""): string => s?.trim() || fallback;
const normUrl = (url: string): string => (url.endsWith("/") ? url : `${url}/`);

/**
 * CLI configuration derived from environment variables.
 */
export const config: Config = {
  PROD_API_BASE_URL: normUrl(
    trim(process.env["PROD_API_BASE_URL"], DEFAULT_PROD_API),
  ),
  PROD_API_TOKEN: trim(process.env["PROD_API_TOKEN"], "unset"),

  LOCAL_API_BASE_URL: normUrl(
    trim(process.env["LOCAL_API_BASE_URL"], DEFAULT_LOCAL_API),
  ),
  LOCAL_API_TOKEN: trim(process.env["LOCAL_API_TOKEN"], "unset"),
};
