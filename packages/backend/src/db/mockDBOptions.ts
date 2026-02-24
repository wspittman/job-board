import fs from "node:fs";
import path from "node:path";
import { connectDB } from "dry-utils-cosmosdb";

type MockDBOptions = NonNullable<
  Parameters<typeof connectDB>[0]["mockDBOptions"]
>;

interface MockDBEnvOptions {
  mockOptionsJson?: string;
  mockOptionsPath?: string;
}

function parseMockDBOptions(rawJson: string, source: string): MockDBOptions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`Invalid Cosmos DB mock options JSON in ${source}.`, {
      cause: error,
    });
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(
      `Cosmos DB mock options in ${source} must be a JSON object keyed by container name.`,
    );
  }

  return parsed as MockDBOptions;
}

/**
 * Loads Cosmos DB mock options from env-driven JSON sources.
 * Inline JSON overrides duplicated container keys loaded from file-based JSON.
 * @param options - Optional env-driven sources for mock options.
 * @returns Parsed mock options map, or undefined when no sources are configured.
 */
export function loadMockDBOptions({
  mockOptionsJson,
  mockOptionsPath,
}: MockDBEnvOptions): MockDBOptions | undefined {
  const trimmedJson = mockOptionsJson?.trim();
  const trimmedPath = mockOptionsPath?.trim();

  if (!trimmedJson && !trimmedPath) {
    return undefined;
  }

  const fileOptions = trimmedPath
    ? parseMockDBOptions(
        fs.readFileSync(path.resolve(process.cwd(), trimmedPath), "utf-8"),
        `file ${trimmedPath}`,
      )
    : undefined;

  const inlineOptions = trimmedJson
    ? parseMockDBOptions(trimmedJson, "DATABASE_MOCK_OPTIONS")
    : undefined;

  return {
    ...(fileOptions ?? {}),
    ...(inlineOptions ?? {}),
  };
}
