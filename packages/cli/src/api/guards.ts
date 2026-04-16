import assert from "node:assert/strict";
import { CommandError } from "../types.ts";
import { config } from "./config.ts";
import type { RuntimeOptions } from "./types.ts";

export function requireAts(ats?: string): "greenhouse" | "lever" {
  const normalized = ats?.toLowerCase();

  if (normalized !== "greenhouse" && normalized !== "lever") {
    throw new CommandError("Invalid argument: ATS");
  }

  return normalized;
}

export function requireIds(
  name: string,
  ...ids: (string | undefined)[]
): string[] {
  const validIds = ids
    .flatMap((id) => (id ? id.split(",") : []))
    .map((id) => id.trim())
    .filter(Boolean);

  if (!validIds.length) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return validIds;
}

export function enforceMutationSafety(runtime: RuntimeOptions): void {
  if (runtime.profile !== "prod") {
    return;
  }

  if (!runtime.confirm) {
    throw new CommandError(
      "Refusing to run mutating production command. Re-run with --confirm and --profile=prod.",
    );
  }
}

export function assertE2EEnv(): void {
  const { LOCAL_API_TOKEN, GREENHOUSE_IDS, LEVER_IDS } = config;
  assert.notEqual(LOCAL_API_TOKEN, "unset", "ENV: LOCAL_API_TOKEN unset");
  assert.ok(GREENHOUSE_IDS.length > 2, "ENV: GREENHOUSE_IDS <= 2");
  assert.ok(LEVER_IDS.length > 2, "ENV: LEVER_IDS <= 2");
}
