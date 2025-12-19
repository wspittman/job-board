const baseUrl = process.env["ADMIN_API_BASE_URL"];
const token = process.env["ADMIN_API_TOKEN"];

export async function fetcher(path: string, method: string, body?: unknown) {
  const endpoint = new URL(`${baseUrl}${path}`).toString();

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await prepareResult(response);

  return result;
}

async function prepareResult(response: Response): Promise<unknown> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const value = contentType.includes("application/json")
    ? (safeJsonParse(responseText) ?? responseText)
    : responseText;

  if (!response.ok) {
    const errorMessage = JSON.stringify(value) ?? response.statusText;
    throw new Error(
      `Request failed with status ${response.status}: ${errorMessage}`,
    );
  }

  return value;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
