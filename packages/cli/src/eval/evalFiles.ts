import type { Context, LLMAction } from "../portal/pTypes.ts";
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
    truth: Bag;
  }[];
}
interface BoolFile extends File {
  yes: string[];
  no: string[];
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

export async function readSources(llmAction: LLMAction): Promise<Source[]> {
  switch (llmAction) {
    case "fillCompanyInfo":
    case "fillJobInfo":
      return await loadContextFolder(llmAction);
    case "isGeneralApplication":
      return await loadBoolFile(llmAction);
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

  return values.map(({ input, truth }) => ({
    name: toFileName(input),
    input,
    truth,
  }));
}

async function loadBoolFile(llmAction: LLMAction): Promise<Source[]> {
  const { fileName, yes, no } =
    (await readObj<BoolFile>({ ...inPlace, file: llmAction })) ?? {};
  if (!fileName || !yes || !no) return [];

  const y = { truth: { bool: true } };
  const n = { truth: { bool: false } };

  return [
    ...yes.map((input) => ({ name: toFileName(input), input, ...y })),
    ...no.map((input) => ({ name: toFileName(input), input, ...n })),
  ];
}

function toFileName(str: string): string {
  return (
    str
      .slice(0, 50)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") ?? "invalid"
  );
}

export async function writeOutcome(
  { runName, llmAction, model, reasoningEffort = undefined }: Run,
  source: Source,
  outcome: Outcome,
): Promise<void> {
  if (llmAction === "isGeneralApplication" && outcome.overall === 1) return;

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
  { runName, llmAction, model, reasoningEffort = undefined }: Run,
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
