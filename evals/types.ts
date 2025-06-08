import type { Company as InnerCompany } from "../packages/backend/src/types/dbModels";
import type { Context as InnerContext } from "../packages/backend/src/types/types";

export type Context<T> = InnerContext<T>;
export type Company = InnerCompany;

export interface Model {
  name: string;
  input: number;
  output: number;
}

export interface Source<T> {
  name: string;
  input: Context<T>;
  ground: T;
  baseline?: Outcome<T>;
}

export interface Scenario<T> {
  action: string;
  model: Model;
  source: Source<T>;
}

export interface Score {
  name: string;
  timestamp: string;
  baseline: string;
  cost: number;
  relativeCost: number;
  duration: number;
  relativeDuration: number;
  accuracy: number;
  relativeAccuracy: number;
  score: number;
}

export interface Outcome<T> extends Score {
  output: T;
  suboptimal?: {
    assert: string;
    property: string;
    result: number;
    actual: unknown;
    ground: unknown;
  }[];
}

export interface Log {
  in: string;
  inTokens: number;
  outTokens: number;
  ms: number;
}
