import { CommandError } from "../types.ts";

export function validateIds(name: string, ids: string[]): string[] {
  const validIds = ids
    .map((id) => id?.replace(",", "").trim() || "")
    .filter(Boolean);

  if (!validIds.length) {
    throw new CommandError(`Invalid argument: ${name}`);
  }

  return validIds;
}

export function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}
