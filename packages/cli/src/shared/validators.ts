import {
  atsTypes,
  dataModelTypes,
  llmActionTypes,
  CommandError,
  type ATS,
  type DataModel,
  type LLMAction,
} from "./types.ts";

/**
 * Validates and normalizes an ATS argument.
 */
export function requireAts(value?: string): ATS {
  const normalized = value?.trim().toLowerCase() as ATS | undefined;
  if (!normalized || !atsTypes.includes(normalized)) {
    throw new CommandError(
      `Invalid ATS. Expected one of: ${atsTypes.join(", ")}`,
    );
  }
  return normalized;
}

/**
 * Validates and normalizes a data model argument.
 */
export function requireDataModel(value?: string): DataModel {
  const normalized = value?.trim().toLowerCase() as DataModel | undefined;
  if (!normalized || !dataModelTypes.includes(normalized)) {
    throw new CommandError(
      `Invalid DATA_MODEL. Expected one of: ${dataModelTypes.join(", ")}`,
    );
  }
  return normalized;
}

/**
 * Validates and normalizes a supported llm action.
 */
export function requireLlmAction(value?: string): LLMAction {
  const normalized = value?.trim() as LLMAction | undefined;
  if (!normalized || !llmActionTypes.includes(normalized)) {
    throw new CommandError(
      `Invalid LLM_ACTION. Expected one of: ${llmActionTypes.join(", ")}`,
    );
  }
  return normalized;
}

/**
 * Ensures one or more IDs are present and normalized.
 */
export function requireIds(name: string, values: string[]): string[] {
  const ids = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (!ids.length) {
    throw new CommandError(
      `Invalid ${name}. Provide at least one non-empty value.`,
    );
  }

  return ids;
}
