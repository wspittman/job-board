import type { LLMAction } from "../portal/pTypes.ts";
import type { NumBag } from "../types.ts";
import { truncate } from "../utils/mathUtils.ts";

const preferFlex: LLMAction[] = [
  "fillCompanyInfo",
  "fillJobInfo",
  "isGeneralApplication",
];

// Model costs per million tokens [input, cache, output], last pulled 6/2/2026
const llmModelCost: Record<string, [number, number, number]> = {
  "gpt-5.5": [5, 0.5, 30.0],
  "gpt-5.4": [2.5, 0.25, 15.0],
  "gpt-5.4-mini": [0.75, 0.075, 4.5],
  "gpt-5.4-nano": [0.2, 0.02, 1.25],
  "gpt-5.2": [1.75, 0.175, 14.0],
  "gpt-5.1": [1.25, 0.125, 10.0],
  "gpt-5": [1.25, 0.125, 10.0],
  "gpt-5-mini": [0.25, 0.025, 2.0],
  "gpt-5-nano": [0.05, 0.005, 0.4],
};

// Cost adjustments for specific LLM actions, estimates last pulled 6/2/2026
// Value1: Average input cache rate (0-1)
// Value2: Average actions per day, backward-looking
const llmActionCost: Partial<Record<LLMAction, [number, number]>> = {
  isGeneralApplication: [0, 393],
  fillJobInfo: [0.412, 390],
  fillCompanyInfo: [0, 3],
};

export function isCostAvailable(model: string, action: LLMAction): boolean {
  return model in llmModelCost && action in llmActionCost;
}

export function cost(
  model: string,
  action: LLMAction,
  metrics: NumBag,
): number {
  const [inCost, cacheCost, outCost] = llmModelCost[model]!;
  const [cacheRate] = llmActionCost[action]!;
  const canFlex = preferFlex.includes(action);
  const { inTokens = 0, outTokens = 0 } = metrics;

  const cacheTokens = Math.floor(inTokens * cacheRate);
  const uncachedTokens = inTokens - cacheTokens;

  // Cost is per million tokens
  const rawCost =
    (uncachedTokens * inCost) / 1_000_000 +
    (cacheTokens * cacheCost) / 1_000_000 +
    (outTokens * outCost) / 1_000_000;

  const cost = canFlex ? rawCost * 0.5 : rawCost;

  return truncate(cost, 8);
}

export function costAg(action: LLMAction, costs: number[]) {
  const [, actionsPerDay] = llmActionCost[action]!;
  const cost = costs.reduce((sum, x) => sum + x, 0);
  const avgCost = cost / (costs.length || 1);
  const costPerMillion = avgCost * 1_000_000;
  const costPerYear = avgCost * actionsPerDay * 365;

  return {
    cost,
    avgCost,
    costPerMillion: truncate(costPerMillion, 2),
    costPerYear: truncate(costPerYear, 2),
  };
}
