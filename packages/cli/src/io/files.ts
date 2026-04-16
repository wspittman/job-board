import fs from "node:fs/promises";
import path from "node:path";

export interface DataPath {
  area: string;
  stage: "in" | "out";
  file: string;
  kind?: string;
}

const DATA_ROOT = path.join(process.cwd(), "packages", "cli", "data");

/**
 * Creates the data path for an artifact.
 */
export function resolveDataFilePath({
  area,
  stage,
  file,
  kind = "json",
}: DataPath): string {
  const ext = kind === "json" ? ".json" : "";
  return path.join(DATA_ROOT, area, stage, `${file}${ext}`);
}

/**
 * Writes structured JSON data to the CLI data directory.
 */
export async function writeJson(
  value: unknown,
  input: DataPath,
): Promise<string> {
  const filePath = resolveDataFilePath(input);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

/**
 * Reads a JSON file if it exists.
 */
export async function readJson<T>(input: DataPath): Promise<T | undefined> {
  const filePath = resolveDataFilePath(input);
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

/**
 * Writes plain text artifacts into the CLI data directory.
 */
export async function writeText(
  value: string,
  input: DataPath,
): Promise<string> {
  const filePath = resolveDataFilePath({ ...input, kind: "txt" });
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
  return filePath;
}

/**
 * Reads a plain text artifact from the CLI data directory.
 */
export async function readText(input: DataPath): Promise<string | undefined> {
  const filePath = resolveDataFilePath({ ...input, kind: "txt" });
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}
