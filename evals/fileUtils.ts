import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Context, Outcome, Source } from "./types";

// Defines the type of file being handled, used for directory naming.
type Role = "Input" | "Outcome" | "Ground" | "Report";

// Base directory for all evaluation-related files.
const basePath = path.join(process.cwd(), "evals");

// Constructs a file path for a given action, role, and optional name.
const getPath = (action: string, role: Role, name = "") =>
  path.join(basePath, `${action}${role}`, name);

/**
 * Reads all source files for a given action and baseline model.
 * Source files consist of an input file, a ground truth file, and optionally a baseline outcome file.
 */
export async function readSources<T>(
  action: string,
  baseline: string
): Promise<Source<T>[]> {
  const names = await readdir(getPath(action, "Input"));
  // Read all sources in parallel and filter out any undefined results (e.g., due to missing files).
  return (
    await Promise.all(
      names.map((name) => readSource<T>(action, name, baseline))
    )
  ).filter((x) => !!x);
}

/**
 * Reads a single source, which includes input, ground truth, and optionally a baseline outcome.
 * Returns undefined if any of the required files are missing.
 */
async function readSource<T>(
  action: string,
  name: string,
  baselineModel: string
): Promise<Source<T> | undefined> {
  const input = await readObj<Context<T>>(action, "Input", name);
  const ground = await readObj<T>(action, "Ground", name);

  let baseline: Outcome<T> | undefined;

  if (baselineModel) {
    const baselineName = `${baselineModel}_${name}`;
    baseline = await readObj<Outcome<T>>(action, "Outcome", baselineName);
  }

  // If any essential part of the source is missing, warn and return undefined.
  if (!input || !ground || (baselineModel && !baseline)) {
    console.warn(`Missing a file for source: ${name}`);
    return undefined;
  }

  return { name, input, ground, baseline };
}

/**
 * Reads and parses a JSON file from the specified path.
 * Returns undefined if the file does not exist or an error occurs during reading/parsing.
 */
export async function readObj<T>(
  action: string,
  role: Role,
  name: string
): Promise<T | undefined> {
  const filePath = getPath(action, role, name);

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
  action: string,
  role: Role,
  name: string,
  obj: unknown
): Promise<void> {
  const dir = getPath(action, role);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), JSON.stringify(obj, null, 2));
}
