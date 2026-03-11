import { llm } from "../../../backend/src/ai/llm.ts";
import { ats as atsObj } from "../../../backend/src/ats/ats.ts";
import { config } from "../../../backend/src/config.ts";
import type { Bag } from "../../../backend/src/types/types.ts";
import { CommandError } from "../types/types.ts";
import {
  llmActionTypes,
  type ATS,
  type DataModel,
  type LLMAction,
} from "./pTypes.ts";

export const LLM_MODEL = config.LLM_MODEL;
export const LLM_REASONING_EFFORT = config.LLM_REASONING_EFFORT;

export const atsTypes: ATS[] = ["greenhouse", "lever"];
export const dataModelTypes: DataModel[] = ["company", "job"];

/**
 * Validate and normalize ATS argument.
 * @param ats - ATS identifier to validate.
 * @returns Normalized ATS identifier.
 * @throws CommandError if the ATS is invalid.
 */
export function validateAts(ats?: string): ATS {
  const normalized = ats?.toLowerCase();

  if (!atsTypes.includes(normalized as ATS)) {
    throw new CommandError("Invalid argument: ATS");
  }

  return normalized as ATS;
}

/**
 * Validate and normalize data model argument.
 * @param dataModel - Data model identifier to validate.
 * @returns Normalized data model identifier.
 * @throws CommandError if the data model is invalid.
 */
export function validateDataModel(dataModel?: string): DataModel {
  const normalized = dataModel?.toLowerCase();

  if (!dataModelTypes.includes(normalized as DataModel)) {
    throw new CommandError("Invalid argument: DATA_MODEL");
  }

  return normalized as DataModel;
}

/**
 * Validate LLM action argument.
 * @param dataModel - Data model identifier to determine valid LLM actions.
 * @param llmAction - LLM action identifier to validate.
 * @returns LLM action identifier.
 * @throws CommandError if the LLM action is invalid.
 */
export function validateLLMAction(
  dataModel: DataModel,
  llmAction?: string,
): LLMAction {
  // We need to retype this so that TS can understand how `includes` should work
  const actionSet = llmActionTypes[dataModel] as readonly string[];

  if (!actionSet.includes(llmAction as LLMAction)) {
    throw new CommandError("Invalid argument: LLM_ACTION");
  }

  return llmAction as LLMAction;
}

export async function fetchInput(
  dataModel: DataModel,
  ats: ATS,
  companyId: string,
  jobId?: string,
) {
  switch (dataModel) {
    case "company":
      return await atsObj.getCompany({ id: companyId, ats }, true);
    case "job":
      return await atsObj.getJob(
        { id: companyId, ats },
        { id: jobId!, companyId },
      );
  }
}

export async function infer(llmAction: LLMAction, context: Bag) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  await llm[llmAction](context as any);
}

/**
 * Fetches the job count for a company from the ATS.
 * @param ats - ATS provider key
 * @param companyId - ATS company slug/id
 * @returns The number of jobs for the company
 */
export async function fetchJobCount(
  ats: ATS,
  companyId: string,
): Promise<number> {
  const jobs = await atsObj.getJobs({ id: companyId, ats }, false);
  return jobs.length;
}
