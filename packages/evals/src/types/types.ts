import { DataModel } from "../portal/pTypes";

export type Bag = Record<string, unknown>;
export type NumBag = Record<string, number>;

// #region Inputs

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
  input: Bag;
  ground: Bag;
}

// #endregion
