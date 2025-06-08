import { specificLLM } from "../packages/backend/src/ai/llm";
import { rubrics } from "./rubrics";
import { catcher } from "./telemetryCatcher";
import type { Outcome, Scenario } from "./types";

/**
 * Evaluates a given scenario by running it against a specified model,
 * comparing the output against ground truth and a baseline.
 */
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

  // Use telemetryCatcher to mark the input and trace the LLM logs
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
      // Cost is per million tokens
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
  const rubric = rubrics[action];

  if (!rubric || !rubric.length) {
    console.warn(`${prefix}: No rubric provided for comparison.`);
    return;
  }

  console.log(`${prefix}: Comparing ground truth`);
  let total = 0;

  for (const [property, func] of rubric) {
    const actual = outcome.output[property] ?? "undefined";
    const ground = source.ground[property] ?? "undefined";
    // Each function in the rubric returns a score between 0 and 1
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

  // Accuracy is the average of all rubric scores
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

  // These are ratios of [0, ∞]
  // e.g., 0.5 = twice as good (cheaper/faster); 1 = same as baseline; 2 = twice as bad (expensive/slower)
  // We want this on the object because it is easy to reason about
  outcome.relativeCost = cost / baseline.cost;
  outcome.relativeDuration = duration / baseline.duration;

  // Normalize the relative cost and duration to [0, 2] using tanh for scoring.
  // The hyperbolic tangent (tanh) function squashes its input to the range [-1, 1].
  // log(1/x) inverts the ratio, so smaller relativeCost/Duration (better) becomes larger.
  // Adding 1 shifts the range from [-1, 1] to [0, 2].
  // Now, 0.001 = way worse; 1 = same as baseline; 1.999 = way better.
  const normCost = 1 + Math.tanh(Math.log(1 / outcome.relativeCost));
  const normDuration = 1 + Math.tanh(Math.log(1 / outcome.relativeDuration));

  // Accuracy is already normalized to [0, 1].
  // We transform it to a [0, 2] scale relative to the baseline's accuracy.
  // If outcome.accuracy is 0.8 and baseline.accuracy is 0.6, relativeAccuracy is 1 + 0.8 - 0.6 = 1.2 (better).
  // If outcome.accuracy is 0.6 and baseline.accuracy is 0.8, relativeAccuracy is 1 + 0.6 - 0.8 = 0.8 (worse).
  // This is both on the object and in the score.
  outcome.relativeAccuracy = 1 + accuracy - baseline.accuracy;

  // These weights should sum to 1, determining the importance of each factor in the final score
  const weightCost = 0.25;
  const weightDuration = 0.05;
  const weightAccuracy = 0.7;

  outcome.score =
    normCost * weightCost +
    normDuration * weightDuration +
    outcome.relativeAccuracy * weightAccuracy;
}
