import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const basePath = path.join(process.cwd(), "evals");
const inputDir = (action: string) => path.join(basePath, `${action}Inputs`);
const outputDir = (action: string) => path.join(basePath, `${action}Outputs`);

export async function readInputNames(action: string): Promise<string[]> {
  return await readdir(inputDir(action));
}

export async function readInputObj<T>(
  action: string,
  filename: string
): Promise<T> {
  const dir = inputDir(action);
  const filePath = path.join(dir, filename);
  const fileContent = await readFile(filePath, "utf-8");
  return JSON.parse(fileContent) as T;
}

export async function writeInputObj(
  action: string,
  name: string,
  obj: unknown
): Promise<void> {
  await writeObject(inputDir(action), name + ".json", obj);
}

export async function writeOutputObj(
  action: string,
  name: string,
  obj: unknown
): Promise<void> {
  await writeObject(outputDir(action), `${name}_${Date.now()}.json`, obj);
}

async function writeObject(
  dir: string,
  filename: string,
  obj: unknown
): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), JSON.stringify(obj, null, 2));
}
