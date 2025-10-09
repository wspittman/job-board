import { llm } from "../../../backend/src/ai/llm.ts";
import { ats as atsObj } from "../../../backend/src/ats/ats.ts";
import { config } from "../../../backend/src/config.ts";
import type { Bag } from "../../../backend/src/types/types.ts";
import type { ATS, DataModel } from "./pTypes.ts";

export const LLM_MODEL = config.LLM_MODEL;
export const LLM_REASONING_EFFORT = config.LLM_REASONING_EFFORT;

export const atsTypes: ATS[] = ["greenhouse", "lever"];
export const dataModelTypes: DataModel[] = ["company", "job"];

/**
 * Type guard to check if a value is a valid ATS type
 */
export function isValidAts(value: string): value is ATS {
  return atsTypes.includes(value as ATS);
}

/**
 * Type guard to check if a value is a valid data model type
 */
export function isValidDataModel(value: string): value is DataModel {
  return dataModelTypes.includes(value as DataModel);
}

export async function fetchInput(
  dataModel: DataModel,
  ats: ATS,
  companyId: string,
  jobId?: string
) {
  switch (dataModel) {
    case "company":
      return await atsObj.getCompany({ id: companyId, ats }, true);
    case "job":
      return await atsObj.getJob(
        { id: companyId, ats },
        { id: jobId!, companyId }
      );
  }
}

export async function infer(dataModel: DataModel, context: Bag) {
  switch (dataModel) {
    case "company":
      await llm.fillCompanyInfo(context as any);
      break;
    case "job":
      await llm.fillJobInfo(context as any);
      break;
  }
}
