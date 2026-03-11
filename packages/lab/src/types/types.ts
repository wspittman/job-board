import type { DataModel, LLMAction } from "../portal/pTypes.ts";

export type Bag = Record<string, unknown>;
export type NumBag = Record<string, number>;

// #region Commands

export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export class CommandError extends Error {}

// #endregion

// #region Eval Inputs

/**
 * Basic information about a particular evaluation run, which has many scenarios.
 */
export interface Run {
  runName: string;
  dataModel: DataModel;
  llmAction: LLMAction;
  llmModel: string;
  llmReasoningEffort?: string;
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
