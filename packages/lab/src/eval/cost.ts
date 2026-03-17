import type { LLMAction } from "../portal/pTypes.ts";
import type { NumBag } from "../types.ts";
import { truncate } from "../utils/mathUtils.ts";

interface ModelCost {
  inCost: number;
  cacheCost: number;
  outCost: number;
}

// Model costs per million tokens [model, input, cache, output], last pulled 3/16/2026
const llmModelCostData: [string, number, number, number][] = [
  // Reasoning Effort allowed
  ["gpt-5-nano", 0.05, 0.005, 0.4],
  ["gpt-5.4-nano", 0.2, 0.02, 1.25],
  ["gpt-5-mini", 0.25, 0.025, 2.0],
  ["gpt-5.4-mini", 0.75, 0.075, 4.5],
  ["gpt-5", 1.25, 0.125, 10.0],
  ["gpt-5.1", 1.25, 0.125, 10.0],
  ["gpt-5.2", 1.75, 0.175, 14.0],
  ["gpt-5.4", 2.5, 0.25, 15.0],

  // Reasoning Effort required
  ["o4-mini", 1.1, 0.275, 4.4],
  ["o3", 2.0, 0.5, 8.0],
];

const llmModelCost: Record<string, ModelCost> = Object.fromEntries(
  llmModelCostData.map(([model, inCost, cacheCost, outCost]) => [
    model,
    { inCost, cacheCost, outCost },
  ]),
);

interface ActionCost {
  // Percentage of tokens expected to be cached
  cachePercent: number;
  // Can flex processing be enabled?
  canFlex: boolean;
  // Estimated actions per week, backward-looking
  actionsPerWeek: number;
}

// Cost adjustments for specific LLM actions, estimates last pulled 3/16/2026
const llmActionCostData: [LLMAction, number, boolean, number][] = [
  ["fillCompanyInfo", 0, true, 25],
  ["fillJobInfo", 0.4, true, 2550],
  // There are slightly more "general application" actions than "fill job info" actions, but not enough to matter at this level of estimation
  ["isGeneralApplication", 0, true, 2550],
];

const llmActionCost: Record<string, ActionCost> = Object.fromEntries(
  llmActionCostData.map(([action, cachePercent, canFlex, actionsPerWeek]) => [
    action,
    { cachePercent, canFlex, actionsPerWeek },
  ]),
);

export function isCostAvailable(model: string, action: LLMAction): boolean {
  return model in llmModelCost && action in llmActionCost;
}

export function cost(
  model: string,
  action: LLMAction,
  metrics: NumBag,
): number {
  const { inCost, cacheCost, outCost } = llmModelCost[model]!;
  const { cachePercent, canFlex } = llmActionCost[action]!;
  const { inTokens = 0, outTokens = 0 } = metrics;

  const cacheTokens = Math.floor(inTokens * cachePercent);
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
  const { actionsPerWeek } = llmActionCost[action]!;
  const cost = costs.reduce((sum, x) => sum + x, 0);
  const avgCost = cost / (costs.length || 1);
  const costPerMillion = avgCost * 1_000_000;
  const costPerYear = avgCost * actionsPerWeek * 52;

  return {
    cost,
    avgCost,
    costPerMillion: truncate(costPerMillion, 2),
    costPerYear: truncate(costPerYear, 2),
  };
}
