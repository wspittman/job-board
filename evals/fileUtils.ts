import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Context } from "../packages/backend/src/types/types";
import type { Outcome, Source } from "./types";

type Role = "Input" | "Outcome" | "Ground" | "Report";

const basePath = path.join(process.cwd(), "evals");
const getPath = (action: string, role: Role, name = "") =>
  path.join(basePath, `${action}${role}`, name);

export async function readSources<T>(
  action: string,
  baseline: string
): Promise<Source<T>[]> {
  const names = await readdir(getPath(action, "Input"));
  return (
    await Promise.all(
      names.map((name) => readSource<T>(action, name, baseline))
    )
  ).filter((x) => !!x);
}

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

  if (!input || !ground || (baselineModel && !baseline)) {
    console.warn(`Missing a file for source: ${name}`);
    return undefined;
  }

  return { name, input, ground, baseline };
}

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
