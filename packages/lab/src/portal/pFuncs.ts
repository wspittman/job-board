import { llm } from "../../../backend/src/ai/llm.ts";
import { ats as atsObj } from "../../../backend/src/ats/ats.ts";
import { CommandError, type Bag } from "../types.ts";
import {
  atsTypes,
  dataModelTypes,
  llmActionTypes,
  type ATS,
  type Context,
  type DataModel,
  type LLMAction,
} from "./pTypes.ts";

export { getLLMOptions } from "../../../backend/src/config.ts";

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
 * @param llmAction - LLM action identifier to validate.
 * @returns LLM action identifier.
 * @throws CommandError if the LLM action is invalid.
 */
export function validateLLMAction(llmAction?: string): LLMAction {
  if (!llmActionTypes.includes(llmAction as LLMAction)) {
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
      return await getJob(ats, companyId, jobId);
  }
}

/**
 * Fetches a job from the ATS, either by a provided job ID or by randomly selecting one from the company's job listings.
 * @param ats - ATS provider key.
 * @param companyId - ATS company slug/id.
 * @param jobId - Optional job ID to fetch. If not provided, a random job from the company's listings will be fetched.
 * @returns A job object from the ATS.
 * @throws CommandError when the company has no jobs.
 */
async function getJob(ats: ATS, companyId: string, jobId?: string) {
  if (!jobId) {
    const jobs = await atsObj.getJobs({ id: companyId, ats }, false);

    if (!jobs.length) {
      throw new CommandError(`No jobs available for ${ats} / ${companyId}`);
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)]!;

    // If the ATS didn't support partial job fetching, we can skip the extra fetch
    if (job.context) {
      return job;
    }

    jobId = job.item.id;
  }

  return await atsObj.getJob({ id: companyId, ats }, { id: jobId, companyId });
}

export async function infer(
  llmAction: LLMAction,
  arg: string | Context<Bag>,
): Promise<Bag> {
  switch (llmAction) {
    case "fillCompanyInfo":
    case "fillJobInfo":
      if (typeof arg === "string") {
        throw new CommandError(`Expected Context<Bag> for ${llmAction}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await llm[llmAction](arg as Context<any>);
      return arg.item;
    case "isGeneralApplication":
    case "extractLocation":
    case "interpretFilters": {
      if (typeof arg === "object") {
        throw new CommandError(`Expected string argument for ${llmAction}`);
      }
      const result = await llm[llmAction](arg);
      return typeof result === "boolean" ? { bool: result } : (result as Bag);
    }
  }
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
