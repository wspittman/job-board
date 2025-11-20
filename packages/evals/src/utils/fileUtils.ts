import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DataModel } from "../portal/pTypes.ts";
import type { Bag, Source } from "../types/types.ts";

type Role = "Input" | "Outcome" | "Ground" | "Report" | "Cache";
type SubRole = DataModel | "playground" | "";

// Base directory for all evaluation-related files.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, "../..");

// Constructs a file path for a given action, role, and optional name.
const getPath = (role: Role, subRole: SubRole, name = "") =>
  path.join(basePath, role.toLowerCase(), subRole, name);

/**
 * Reads all source files for a given action and baseline model.
 * Source files consist of an input file, a ground truth file, and optionally a baseline outcome file.
 */
export async function readSources(subRole: SubRole): Promise<Source[]> {
  const names = await readdir(getPath("Input", subRole));
  // Read all sources in parallel and filter out any undefined results (e.g., due to missing files).
  return (
    await Promise.all(names.map((name) => readSource(subRole, name)))
  ).filter((x) => !!x);
}

/**
 * Reads a single source, which includes input and ground truth
 * Returns undefined if any of the required files are missing.
 */
async function readSource(
  subRole: SubRole,
  sourceName: string
): Promise<Source | undefined> {
  const input = await readObj<Bag>("Input", subRole, sourceName);
  const ground = await readObj<Bag>("Ground", subRole, sourceName);
  // If any essential part of the source is missing, warn and return undefined.
  if (!input || !ground) {
    console.warn(`Missing a file for source: ${sourceName}`);
    return undefined;
  }

  return { sourceName, input, ground };
}

/**
 * Reads and parses a JSON file from the specified path.
 * Returns undefined if the file does not exist or an error occurs during reading/parsing.
 */
export async function readObj<T>(
  role: Role,
  subRole: SubRole,
  name: string
): Promise<T | undefined> {
  let filePath = getPath(role, subRole, name);

  if (!filePath.endsWith(".json")) {
    filePath += ".json";
  }

  try {
    const file = await readFile(filePath, "utf-8");
    return JSON.parse(file);
  } catch (error) {
    return undefined;
  }
}

/**
 * Writes an object to a JSON file, creating the directory if it doesn't exist.
 * The JSON is pretty-printed with an indent of 2 spaces.
 */
export async function writeObj(
  obj: object,
  role: Role,
  subRole: SubRole,
  ...keys: string[]
): Promise<void> {
  const markedObj = { evalTS: new Date().toISOString(), ...obj };
  const dir = getPath(role, subRole);
  let filePath = path.join(dir, keys.filter(Boolean).join("_"));

  if (!filePath.endsWith(".json")) {
    filePath += ".json";
  }

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(markedObj, null, 2));
}
