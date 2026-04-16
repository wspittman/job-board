export type ApiEnvironment = "local" | "prod";

export interface RuntimeContext {
  apiEnv: ApiEnvironment;
  allowProduction: boolean;
  productionConfirmation: string;
  dryRun: boolean;
}

const PROD_CONFIRMATION_PHRASE = "I_UNDERSTAND_PRODUCTION_CHANGES";

const context: RuntimeContext = {
  apiEnv: "local",
  allowProduction: false,
  productionConfirmation: "",
  dryRun: false,
};

export function getRuntimeContext(): RuntimeContext {
  return context;
}

export function getProductionConfirmationPhrase(): string {
  return PROD_CONFIRMATION_PHRASE;
}

export function applyRuntimeFlags(args: string[]): string[] {
  const filtered: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--env") {
      const value = args[i + 1];

      if (value === "local" || value === "prod") {
        context.apiEnv = value;
        i++;
        continue;
      }

      throw new Error(`Invalid value for --env: ${value ?? "(missing)"}`);
    }

    if (arg === "--allow-production") {
      context.allowProduction = true;
      continue;
    }

    if (arg === "--confirm-production") {
      context.productionConfirmation = args[i + 1] ?? "";
      i++;
      continue;
    }

    if (arg === "--dry-run") {
      context.dryRun = true;
      continue;
    }

    filtered.push(arg!);
  }

  return filtered;
}

/**
 * Reset runtime flags before each invocation to avoid stale state.
 */
export function resetRuntimeContext(): void {
  context.apiEnv = "local";
  context.allowProduction = false;
  context.productionConfirmation = "";
  context.dryRun = false;
}
