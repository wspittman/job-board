export const atsTypes = ["greenhouse", "lever"] as const;
export type ATS = (typeof atsTypes)[number];

export const dataModelTypes = ["company", "job"] as const;
export type DataModel = (typeof dataModelTypes)[number];

export const llmActionTypes = [
  "fillCompanyInfo",
  "fillJobInfo",
  "isGeneralApplication",
  "extractLocation",
  "interpretFilters",
] as const;
export type LLMAction = (typeof llmActionTypes)[number];

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface CommandContext {
  args: string[];
  flags: Record<string, string | boolean>;
  commandName: string;
}

export interface CommandDef {
  usage(): string | string[];
  description: string;
  mutateApi?: boolean;
  run(ctx: CommandContext): Promise<void>;
}

export class CommandError extends Error {}
