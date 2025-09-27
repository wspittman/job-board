import type { Context } from "./packagePortal";

// #region Inputs

export type DataModel = "Company" | "Job";

interface RunBase {
  runName: string;
  dataModel: DataModel;
  llmModel: string;
}

/**
 * Basic information about a particular evaluation run, which has many scenarios.
 */
export interface Run<T> extends RunBase {
  fn: (input: Context<T>) => Promise<boolean>;
}

/**
 * Represents a specific scenario within an evaluation run.
 */
export interface Scenario<T> extends Run<T> {
  source: Source<T>;
}

/**
 * A source consists of the input context and the ground truth for a particular scenario.
 */
export interface Source<T> {
  sourceName: string;
  input: Context<T>;
  ground: T;
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
export interface Score extends RunBase {
  timestamp: string;
  metrics: Record<string, number>;
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
export interface Outcome<T> extends Score {
  sourceName: string;
  output: T;
  suboptimal?: MatchResult[];
}

// #endregion
