import { specificLLM } from "../packages/backend/src/ai/llm";
import { rubrics } from "./rubrics";
import { catcher } from "./telemetryCatcher";
import type { Outcome, Scenario } from "./types";

export async function evaluate<T>(scenario: Scenario<T>): Promise<Outcome<T>> {
  const { action, model, source } = scenario;
  const prefix = `${action} / ${model.name} / ${source.name}`;
  const outcome = await runScenario(scenario, prefix);
  await compareGround(scenario, outcome, prefix);
  await compareBaseline(scenario, outcome, prefix);
  return outcome;
}

async function runScenario<T>(
  scenario: Scenario<T>,
  prefix: string
): Promise<Outcome<T>> {
  const { action, model } = scenario;
  console.log(`${prefix}: Running scenario`);

  const markedInput = catcher.createMarkedInput(scenario);
  await specificLLM(model.name)[action](markedInput);
  const log = catcher.find(markedInput);

  if (!log) {
    throw new Error(`${prefix} No log found`);
  }

  return {
    name: `${model.name}_${scenario.source.name}`,
    timestamp: new Date().toISOString(),
    baseline: scenario.source.baseline?.name || "none",
    cost:
      (log.inTokens * model.input) / 1_000_000 +
      (log.outTokens * model.output) / 1_000_000,
    relativeCost: 0,
    duration: log.ms,
    relativeDuration: 0,
    accuracy: 0,
    relativeAccuracy: 0,
    score: 0,
    output: markedInput.item,
  };
}

async function compareGround<T>(
  { action, source }: Scenario<T>,
  outcome: Outcome<T>,
  prefix: string
): Promise<void> {
  console.log(`${prefix}: Comparing ground truth`);
  const rubric = rubrics[action] || [];
  let total = 0;

  for (const [property, func] of rubric) {
    const actual = outcome.output[property] ?? "undefined";
    const ground = source.ground[property] ?? "undefined";
    const result = await func(actual, ground);

    total += result;

    if (result < 1) {
      outcome.suboptimal ??= [];
      outcome.suboptimal.push({
        property,
        assert: func.name,
        result,
        actual,
        ground,
      });
    }
  }

  outcome.accuracy = total / rubric.length;
}

async function compareBaseline<T>(
  { source }: Scenario<T>,
  outcome: Outcome<T>,
  prefix: string
): Promise<void> {
  if (!source.baseline) {
    console.warn(`${prefix}: No baseline provided for comparison.`);
    return;
  }

  console.log(`${prefix}: Comparing baseline`);

  const baseline = source.baseline;
  const { accuracy, cost, duration } = outcome;

  outcome.relativeCost = cost / baseline.cost;
  outcome.relativeDuration = duration / baseline.duration;
  outcome.relativeAccuracy = accuracy / baseline.accuracy;

  // These should sum to 1
  const weightCost = 0.2;
  const weightDuration = 0.05;
  const weightAccuracy = 0.75;

  const score =
    outcome.relativeCost ** -weightCost *
    outcome.relativeDuration ** -weightDuration *
    outcome.relativeAccuracy ** weightAccuracy;

  outcome.score = score;
}
