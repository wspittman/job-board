import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Strings = string | string[] | undefined;

export interface Place {
  group: "cache" | "eval" | "jobCounts" | "playground";
  stage: "in" | "out";
  folder?: Strings;
  file?: Strings;
}

// Base directory for all evaluation-related files.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, "../../data");

const asArray = (val: Strings): string[] =>
  val ? (Array.isArray(val) ? val : [val]) : [];

const getFolderPath = ({ group, stage, folder }: Place) =>
  path.join(basePath, group, stage, ...asArray(folder));

const getFilePath = ({ file, ...rest }: Place) => {
  let filePath = path.join(getFolderPath(rest), asArray(file).join("_"));
  if (!filePath.endsWith(".json")) {
    filePath += ".json";
  }
  return filePath;
};

/**
 * Reads and parses a JSON file from the specified file.
 * Returns undefined if the file does not exist or an error occurs during reading/parsing.
 */
export async function readObj<T>(place: Place): Promise<T | undefined> {
  const filePath = getFilePath(place);

  try {
    const file = await readFile(filePath, "utf-8");
    return JSON.parse(file) as T;
  } catch {
    return undefined;
  }
}

export async function readManyObj<T>(place: Place): Promise<T[]> {
  const folderPath = getFolderPath(place);

  try {
    const names = await readdir(folderPath);

    return (
      await Promise.all(
        names.map((name) => readObj<T>({ ...place, file: name })),
      )
    ).filter(Boolean) as T[];
  } catch {
    return [];
  }
}

/**
 * Writes an object to a JSON file, creating the directory if it doesn't exist.
 * The JSON is pretty-printed with an indent of 2 spaces.
 */
export async function writeObj(obj: object, place: Place): Promise<void> {
  const filePath = getFilePath(place);
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  const evalTS = new Date().toISOString();
  const markedObj = { evalTS, fileName, ...obj };

  await mkdir(dirPath, { recursive: true });
  await writeFile(filePath, JSON.stringify(markedObj, null, 2));
}
