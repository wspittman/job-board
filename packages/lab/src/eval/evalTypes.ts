import type { Context, LLMAction } from "../portal/pTypes.ts";
import type { Bag, NumBag } from "../types.ts";

/**
 * Basic information about a particular evaluation run, which has many scenarios.
 */
export interface Run {
  runName: string;
  llmAction: LLMAction;
  model: string;
  reasoningEffort?: string;
}

/**
 * A source consists of the input context and the ground truth for a particular scenario.
 */
export interface Source {
  name: string;
  input: Context<Bag> | string;
  truth: Bag;
}

export interface Report extends Run, Judgement {
  metrics: NumBag;
  cost: number;
  avgCost: number;
  costPerMillion?: number;
}

export interface Outcome extends Run, Judgement {
  sourceName: string;
  metrics: NumBag;
  cost: number;
  output: Bag;
}

/**
 * The judgement of a scenario, which can include various stats about the correctness of the output, as well as details about any suboptimal checks.
 */
export interface Judgement extends Stats {
  suboptimal?: CheckOut[];
}

/**
 * Stats about a judged rubric.
 * Can also be an aggregate of multiple Stats.
 */
export interface Stats {
  match?: {
    good: number;
    bad: number;
    total: number;
    score: number;
  };
  omit?: {
    good: number;
    badFind: number;
    badOmit: number;
    total: number;
    precision?: number;
    recall?: number;
    f1?: number;
  };
  overall?: number;
}

/**
 * A rubric defines how to check the correctness of an actual output against the expected output for a given data model.
 * It can be a nested structure where the leaves are CheckFunctions that perform specific checks, and the branches are Rubrics for nested properties.
 */
export type Rubric<T> = {
  [key in keyof T]: CheckFunction | Rubric<Bag>;
};

/**
 * A function that checks the correctness of an actual value against an expected value, and returns a score or judgement.
 */
export type CheckFunction = (input: CheckIn) => CheckOut | Promise<CheckOut>;

/**
 * The output of a judgement check.
 */
export interface CheckOut extends CheckIn {
  check: string;
  // Either score or omit will be set
  omit?: "good" | "badFind" | "badOmit";
  score?: number;
}

/**
 * The input for a judgement check
 */
export interface CheckIn {
  prop: string;
  actual: unknown;
  expected: unknown;
}
