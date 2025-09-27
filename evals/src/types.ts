import type { Context, InferFn } from "./packagePortal";

export type Bag = Record<string, unknown>;
export type NumBag = Record<string, number>;

// #region Inputs

export type DataModel = "company" | "job";

export type Rubric<T> = {
  [key in keyof T]: MatchFunction | Rubric<Bag>;
};

export interface DataModelBundle {
  dataModel: DataModel;
  fn: InferFn;
  rubric: Rubric<Bag>;
}

/**
 * Basic information about a particular evaluation run, which has many scenarios.
 */
export interface Run {
  runName: string;
  dataModel: DataModel;
  llmModel: string;
}

/**
 * A source consists of the input context and the ground truth for a particular scenario.
 */
export interface Source {
  sourceName: string;
  input: Context;
  ground: Bag;
}

// #endregion

// #region Comparisons

export interface MatchInput {
  property: string;
  matcher: string;
  actual: unknown;
  expected: unknown;
}

export interface MatchResult extends Partial<MatchInput> {
  // 0..1, only present for fuzzy matches
  score?: number;
  match?: boolean;
  badMatch?: boolean;
  badFind?: boolean;
  badOmit?: boolean;
}

export type MatchFunction = (input: MatchInput) => Promise<MatchResult>;

// #endregion

// #region Outputs

/**
 * A score summarizing performance on one or more scenarios.
 */
export interface Score extends Run {
  timestamp: string;
  metrics: NumBag;
  cost: number;
  score: number;
  matches: number;
  badMatches: number;
  badFinds: number;
  badOmits: number;
}

/**
 * The outcome of running a scenario, including various performance metrics.
 */
export interface Outcome extends Score {
  sourceName: string;
  output: Bag;
  suboptimal?: MatchResult[];
}

// #endregion
