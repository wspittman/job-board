export const atsTypes = ["greenhouse", "lever"];
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export class CommandError extends Error {}
