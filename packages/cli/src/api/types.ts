export type ExecutionProfile = "local" | "prod";

export interface RuntimeOptions {
  profile: ExecutionProfile;
  confirm: boolean;
}

export interface ApiCommandContext {
  runtime: RuntimeOptions;
}

export interface ApiCommand {
  usage(): string | string[];
  run(args: string[], context: ApiCommandContext): Promise<void>;
}
