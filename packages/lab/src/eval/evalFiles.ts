import type { Context, DataModel, LLMAction } from "../portal/pTypes.ts";
import type { Bag } from "../types.ts";
import {
  readManyObj,
  readObj,
  writeObj,
  type Place,
} from "../utils/fileUtils.ts";
import type { Outcome, Report, Run, Source } from "./evalTypes.ts";

interface File {
  fileName: string;
}
interface StringsFile extends File {
  values: {
    input: string;
    truth: Bag | boolean;
  }[];
}
type ContextFile = File & Context<Bag> & Record<LLMAction, Bag>;

const inPlace: Place = { group: "eval", stage: "in" };
const outPlace: Place = { group: "eval", stage: "out" };
const inPlaces: Record<LLMAction, Place> = {
  fillCompanyInfo: { ...inPlace, folder: "company" },
  fillJobInfo: { ...inPlace, folder: "job" },
  isGeneralApplication: { ...inPlace, file: "isGeneralApplication" },
  extractLocation: { ...inPlace, file: "extractLocation" },
  interpretFilters: { ...inPlace, file: "interpretFilters" },
};

const placeholders: Record<DataModel, object> = {
  company: { fillCompanyInfo: {} },
  job: { fillJobInfo: {} },
};

export async function writeInFile(
  obj: Context<unknown>,
  dataModel: DataModel,
  ...keys: string[]
): Promise<void> {
  await writeObj(
    { ...obj, ...placeholders[dataModel] },
    { ...inPlace, folder: dataModel, file: keys },
  );
}

export async function readSources(llmAction: LLMAction): Promise<Source[]> {
  switch (llmAction) {
    case "fillCompanyInfo":
    case "fillJobInfo":
      return await loadContextFolder(llmAction);
    case "isGeneralApplication":
    case "extractLocation":
    case "interpretFilters":
      return await loadStringsFile(llmAction);
  }
}

async function loadContextFolder(llmAction: LLMAction): Promise<Source[]> {
  const files = await readManyObj<ContextFile>(inPlaces[llmAction]);
  return files.map((x) => ({
    name: x.fileName,
    input: { item: x.item, context: x.context },
    truth: x[llmAction],
  }));
}

async function loadStringsFile(llmAction: LLMAction): Promise<Source[]> {
  const { fileName, values } =
    (await readObj<StringsFile>({ ...inPlace, file: llmAction })) ?? {};
  if (!fileName || !values) return [];

  return values.map(({ input, truth }, i) => ({
    name: `${fileName}_${i}`,
    input,
    truth: typeof truth === "boolean" ? { bool: truth } : truth,
  }));
}

export async function writeOutcome(
  { runName, llmAction, model, reasoningEffort = "" }: Run,
  source: Source,
  outcome: Outcome,
): Promise<void> {
  await writeObj(outcome, {
    ...outPlace,
    folder: [
      llmAction,
      [runName, model, reasoningEffort].filter(Boolean).join("_"),
    ],
    file: source.name,
  });
}

export async function writeReport(
  { runName, llmAction, model, reasoningEffort = "" }: Run,
  report: Report,
): Promise<void> {
  await writeObj(report, {
    ...outPlace,
    folder: [
      llmAction,
      [runName, model, reasoningEffort].filter(Boolean).join("_"),
    ],
    file: "zReport",
  });
}
