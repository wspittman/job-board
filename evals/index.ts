import { batch, setAsyncLogging } from "dry-utils-async";
import { evaluate } from "./evaluate";
import { readObj, readSources, writeObj } from "./fileUtils";
import type { Company, Model, Outcome, Scenario, Score } from "./types";

setAsyncLogging({
  errorFn: (msg, val) => console.error(new Error(msg, { cause: val })),
  logFn: console.log,
});

const useOpenAI = true;
const modelFilter = "gpt-4.1-nano";
const baseline = "gpt-4o-mini";

// Model costs last pulled 5/20/2025
type ModelTuple = [name: string, input: number, output: number];

const openai: ModelTuple[] = [
  ["gpt-4o-mini", 0.15, 0.6],
  ["gpt-4.1-nano", 0.1, 0.4],
  ["gpt-4.1-mini", 0.4, 1.6],
  ["o3-mini", 1.1, 4.4],
  ["o4-mini", 1.1, 4.4],
  ["gpt-4.1", 2.0, 8.0],
  ["gpt-4o", 2.5, 10.0],
];

const google: ModelTuple[] = [
  ["gemini-1.5-flash-8b", 0.0375, 0.15],
  ["gemini-2.0-flash-lite", 0.075, 0.3],
  ["gemini-2.0-flash", 0.1, 0.4],
  ["gemini-2.5-flash", 0.15, 0.6],
  ["gemini-2.5-flash-thinking", 0.15, 3.5],
  ["gemini-1.5-pro", 1.25, 5.0],
  ["gemini-1.5-pro-128k", 2.5, 10.0],
  ["gemini-2.5-pro-preview-03-25", 1.25, 10.0],
];

const models: Model[] = (useOpenAI ? openai : google)
  .filter(([name]) => !modelFilter || name.includes(modelFilter))
  .filter(([name]) => name !== baseline)
  .map(([name, input, output]) => ({ name, input, output }));

run().catch((err) => {
  console.error("Error running evaluation:", err);
});

async function run() {
  const fillCompanyInfoScores = await runAction<Company>("fillCompanyInfo");

  console.dir(fillCompanyInfoScores, { depth: null, colors: true });
  const reportName = `fillCompanyInfo_${Date.now()}.json`;
  await writeObj("", "Report", reportName, fillCompanyInfoScores);
}

// return { model => aggregate score }
async function runAction<T>(action: string): Promise<Record<string, Score>> {
  console.log(`${action}: Running action against ${models.length} models`);

  const results: Record<string, Score> = {};
  const sources = await readSources<T>(action, baseline);

  console.log(`${action}: Found ${sources.length} sources`);

  for (const model of models) {
    const scenarios: Scenario<T>[] = sources.map((source) => ({
      action,
      model,
      source,
    }));

    const outcomes: Outcome<T>[] = [];

    await batch(`${action}_${model.name}`, scenarios, async (scenario) => {
      const file = `${model.name}_${scenario.source.name}`;
      let outcome = await readObj<Outcome<T>>(action, "Outcome", file);
      outcome ??= await evaluate(scenario);
      outcomes.push(outcome);
      await writeObj(action, "Outcome", file, outcome);
    });

    results[model.name] = average(outcomes, model.name, baseline);
  }

  return results;
}

function average(scores: Score[], name: string, baseline: string): Score {
  const avg = (prop: Exclude<keyof Score, "name" | "timestamp" | "baseline">) =>
    scores.reduce((sum, v) => sum + v[prop], 0) / scores.length;

  return {
    name,
    timestamp: new Date().toISOString(),
    baseline: baseline || "none",
    cost: avg("cost"),
    relativeCost: avg("relativeCost"),
    duration: avg("duration"),
    relativeDuration: avg("relativeDuration"),
    accuracy: avg("accuracy"),
    relativeAccuracy: avg("relativeAccuracy"),
    score: avg("score"),
  };
}
