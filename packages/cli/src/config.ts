import { atsTypes, type ATS } from "./portal/atsConsts.ts";

interface Config {
  // API configs
  API_URL: string;
  ADMIN_TOKEN: string;

  PROD_API_URL: string;
  PROD_ADMIN_TOKEN?: string;

  // E2E test configs
  E2E_COMPANIES: Partial<Record<ATS, string[]>>;
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
 * Parses a `|`-delimited list of `ats:id1,id2` entries into a record.
 * Example: `greenhouse:id1,id2|lever:id3,id4`
 */
const toCompanies = (s: string = ""): Partial<Record<ATS, string[]>> => {
  if (!s) return {};
  return Object.fromEntries(
    s.split("|").map((entry) => {
      const [ats = "", ids = ""] = entry.split(":");
      const trimmed = ats.trim();
      if (!atsTypes.includes(trimmed as ATS)) {
        throw new Error(
          `E2E_COMPANIES: unknown ATS "${trimmed}". Expected one of: ${atsTypes.join(", ")}`,
        );
      }
      return [trimmed as ATS, toArr(ids)];
    }),
  );
};

/**
 * CLI configuration derived from environment variables.
 */
export const config: Config = {
  API_URL: normUrl(getReqEnv("API_URL")),
  ADMIN_TOKEN: getReqEnv("ADMIN_TOKEN"),

  PROD_API_URL: normUrl(getReqEnv("PROD_API_URL")),
  PROD_ADMIN_TOKEN: getEnv("PROD_ADMIN_TOKEN"),

  E2E_COMPANIES: toCompanies(getEnv("E2E_COMPANIES")),
};
