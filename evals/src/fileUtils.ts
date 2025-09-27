import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "node:path";
import type { Context } from "./packagePortal";
import type { DataModel, Source } from "./types";

type Role = "Input" | "Outcome" | "Ground" | "Report";

// Base directory for all evaluation-related files.
const basePath = path.join(process.cwd(), "evals");

// Constructs a file path for a given action, role, and optional name.
const getPath = (role: Role, dataModel: DataModel, name = "") =>
  path.join(basePath, role.toLowerCase(), dataModel.toLowerCase(), name);

/**
 * Reads all source files for a given action and baseline model.
 * Source files consist of an input file, a ground truth file, and optionally a baseline outcome file.
 */
export async function readSources<T>(
  dataModel: DataModel
): Promise<Source<T>[]> {
  const names = await readdir(getPath("Input", dataModel));
  // Read all sources in parallel and filter out any undefined results (e.g., due to missing files).
  return (
    await Promise.all(names.map((name) => readSource<T>(dataModel, name)))
  ).filter((x) => !!x);
}

/**
 * Reads a single source, which includes input and ground truth
 * Returns undefined if any of the required files are missing.
 */
async function readSource<T>(
  dataModel: DataModel,
  sourceName: string
): Promise<Source<T> | undefined> {
  const input = await readObj<Context<T>>("Input", dataModel, sourceName);
  const ground = await readObj<T>("Ground", dataModel, sourceName);

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
  dataModel: DataModel,
  name: string
): Promise<T | undefined> {
  const filePath = getPath(role, dataModel, name);

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
  dataModel: DataModel,
  ...keys: string[]
): Promise<void> {
  const markedObj = { evalTS: new Date().toISOString(), ...obj };
  const dir = getPath(role, dataModel);

  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, keys.join("_") + ".json"),
    JSON.stringify(markedObj, null, 2)
  );
}
