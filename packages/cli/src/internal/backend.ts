import { llm } from "../../../backend/src/ai/llm.ts";
import { getLLMOptions } from "../../../backend/src/config.ts";
import { ats } from "../../../backend/src/ats/ats.ts";
import type { Company, Job } from "../../../backend/src/models/models.ts";
import type { Context } from "../../../backend/src/types/types.ts";
import type { ATS, DataModel, LLMAction } from "../shared/types.ts";

export { getLLMOptions };

/**
 * Loads a company or job sample from a selected ATS.
 */
export async function fetchSample(
  dataModel: DataModel,
  atsName: ATS,
  companyId: string,
  jobId?: string,
): Promise<unknown> {
  if (dataModel === "company") {
    return await ats.getCompany({ id: companyId, ats: atsName }, true);
  }

  if (!jobId) {
    const jobs = await ats.getJobs({ id: companyId, ats: atsName }, false);
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

    if (!randomJob) {
      throw new Error(`No jobs found for ${atsName}/${companyId}`);
    }

    if (randomJob.context) {
      return randomJob;
    }

    jobId = randomJob.item.id;
  }

  return await ats.getJob(
    { id: companyId, ats: atsName },
    { id: jobId, companyId },
  );
}

/**
 * Runs an LLM extraction action over either text or an object payload.
 */
export async function runLlmAction(
  action: LLMAction,
  payload: unknown,
): Promise<unknown> {
  switch (action) {
    case "fillCompanyInfo":
    case "fillJobInfo": {
      if (!payload || typeof payload !== "object") {
        throw new Error(`Action ${action} requires object input`);
      }
      if (action === "fillCompanyInfo") {
        await llm.fillCompanyInfo(payload as Context<Company>);
      } else {
        await llm.fillJobInfo(payload as Context<Job>);
      }
      return payload as Record<string, unknown>;
    }
    case "isGeneralApplication":
    case "extractLocation":
    case "interpretFilters": {
      if (typeof payload !== "string") {
        throw new Error(`Action ${action} requires string input`);
      }
      return await llm[action](payload);
    }
  }
}

/**
 * Fetches the number of jobs available for a company.
 */
export async function fetchJobCount(
  atsName: ATS,
  companyId: string,
): Promise<number> {
  const jobs = await ats.getJobs({ id: companyId, ats: atsName }, false);
  return jobs.length;
}
