import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray } from "./utils.ts";

type Strings = string | string[] | undefined;
type Ext = "json" | "md" | "html";

export interface Place {
  group: "html" | "cache" | "eval";
  stage: "in" | "out";
  folder?: Strings;
  file?: Strings;
}

// Base directory for all evaluation-related files.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, "../../logs");

const toArray = (val: Strings): string[] => asArray(val ?? []).filter(Boolean);

const getFolderPath = ({ group, stage, folder }: Place) =>
  path.join(basePath, group, stage, ...toArray(folder));

const getFilePath = ({ file, ...rest }: Place, ext: Ext) => {
  let filePath = path.join(getFolderPath(rest), toArray(file).join("_"));

  if (ext && !filePath.endsWith(`.${ext}`)) {
    filePath += `.${ext}`;
  }
  return filePath;
};

/**
 * Reads a text file from the specified file.
 * @param place The location of the file to read.
 * @param ext The file extension to use. Defaults to "md".
 * @returns The content of the file as a string, or undefined if the file does not exist or an error occurs.
 */
export async function readText(
  place: Place,
  ext: Ext = "md",
): Promise<string | undefined> {
  const filePath = getFilePath(place, ext);

  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

/**
 * Reads and parses a JSON file from the specified file.
 * @param place The location of the file to read.
 * @returns The parsed object from the JSON file, or undefined if the file does not exist or an error occurs.
 */
export async function readObj<T>(place: Place): Promise<T | undefined> {
  const file = await readText(place, "json");

  if (!file) return undefined;

  try {
    return JSON.parse(file) as T;
  } catch {
    return undefined;
  }
}

/**
 * Reads all JSON files in the specified folder and returns an array of parsed objects.
 * @param place The location of the folder to read from. The `file` property is ignored.
 * @returns An array of parsed objects from the JSON files in the folder, or an empty array if the folder does not exist or an error occurs.
 */
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
 * Writes a string to a file at the specified place, creating parent directories as needed.
 * @param text The text content to write to the file.
 * @param place The location of the file to write to.
 * @param ext The file extension to use. Defaults to "html".
 */
export async function writeText(
  text: string,
  place: Place,
  ext: Ext = "html",
): Promise<void> {
  const filePath = getFilePath(place, ext);
  const dirPath = path.dirname(filePath);

  await mkdir(dirPath, { recursive: true });
  await writeFile(filePath, text, "utf-8");
}

/**
 * Writes an object to a JSON file, creating the directory if it doesn't exist.
 * The JSON is pretty-printed with an indent of 2 spaces.
 * @param obj The object to write to the file.
 * @param place The location of the file to write to.
 */
export async function writeObj(obj: object, place: Place): Promise<void> {
  const filePath = getFilePath(place, "json");
  const fileName = path.basename(filePath);
  const evalTS = new Date().toISOString();
  const markedObj = { evalTS, fileName, ...obj };

  await writeText(JSON.stringify(markedObj, null, 2), place, "json");
}
