interface Config {
  ADMIN_API_BASE_URL: string;
  ADMIN_API_TOKEN: string;
}

const baseUrl = process.env["ADMIN_API_BASE_URL"]?.trim();
const token = process.env["ADMIN_API_TOKEN"]?.trim();

if (!baseUrl) {
  throw new Error("ADMIN_API_BASE_URL must be set.");
}

if (!token) {
  throw new Error("ADMIN_API_TOKEN must be set.");
}

const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

/**
 * CLI configuration derived from environment variables.
 */
export const config: Config = {
  ADMIN_API_BASE_URL: normalizedBaseUrl,
  ADMIN_API_TOKEN: token,
};
