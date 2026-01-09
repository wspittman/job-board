export const atsTypes = ["greenhouse", "lever"] as const;
export type Ats = (typeof atsTypes)[number];
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Command {
  usage(): string | string[];
  prerequisite?(): void;
  run(args: string[]): Promise<void>;
}

export class CommandError extends Error {}
