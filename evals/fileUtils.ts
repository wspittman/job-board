import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

type Phase = "Inputs" | "Outputs" | "Ground" | "OutputBaselines";

const basePath = path.join(process.cwd(), "evals");
const getDir = (action: string, phase: Phase) =>
  path.join(basePath, `${action}${phase}`);
const cache: Record<string, unknown> = {};

export async function readInputNames(action: string): Promise<string[]> {
  return await readdir(getDir(action, "Inputs"));
}

export async function readObj<T>(
  action: string,
  phase: Phase,
  name: string
): Promise<T | undefined> {
  const key = `${action}${phase}${name}`;
  if (cache[key]) {
    return cache[key] as T;
  }

  const dir = getDir(action, phase);
  const filePath = path.join(dir, name);

  let fileContent: string;
  try {
    fileContent = await readFile(filePath, "utf-8");
  } catch (error) {
    return undefined;
  }

  const result = JSON.parse(fileContent) as T;
  cache[key] = result;
  return result;
}

export async function writeObj(
  action: string,
  phase: Phase,
  name: string,
  obj: unknown
): Promise<void> {
  const dir = getDir(action, phase);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), JSON.stringify(obj, null, 2));
}
