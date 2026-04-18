export type Bag = Record<string, unknown>;
export type NumBag = Record<string, number>;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ENV = "prod" | "local";

export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export type Registry = Record<string, Command>;

export class CommandError extends Error {}
