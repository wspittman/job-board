export type Bag = Record<string, unknown>;
export type NumBag = Record<string, number>;

export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export class CommandError extends Error {}
