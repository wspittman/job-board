export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export class CommandError extends Error {}
