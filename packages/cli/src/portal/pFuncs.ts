import { llm } from "../../../backend/src/ai/llm.ts";
import { ats as atsObj } from "../../../backend/src/ats/ats.ts";
import { JOB_EXPIRY_MS } from "../../../backend/src/utils/constants.ts";
import { withLocalTelemetryContext } from "../../../backend/src/utils/telemetry.ts";
import { CommandError, type Bag } from "../types.ts";
import type { ATS } from "./atsConsts.ts";
import { llmActionTypes, type Context, type LLMAction } from "./pTypes.ts";

export { getLLMOptions } from "../../../backend/src/config.ts";

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

/**
 * Fetches company information from the ATS based on the provided company ID and ATS provider key.
 * @param ats ATS provider key
 * @param companyId ATS company slug/id
 * @returns A company object from the ATS
 */
export async function fetchCompany(ats: ATS, companyId: string) {
  return await withLocalTelemetryContext("Portal.FetchCompany", async () => {
    return await atsObj.getCompany({ id: companyId, ats }, true);
  });
}

/**
 * Fetches a job from the ATS, either by a provided job ID or by randomly selecting one from the company's job listings.
 * @param ats ATS provider key.
 * @param companyId ATS company slug/id.
 * @param jobId Optional job ID to fetch. If not provided, a random job from the company's listings will be fetched.
 * @returns A job object from the ATS.
 * @throws CommandError when the company has no jobs.
 */
export async function fetchJob(ats: ATS, companyId: string, jobId?: string) {
  return await withLocalTelemetryContext("Portal.FetchJob", async () => {
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

    return await atsObj.getJob(
      { id: companyId, ats },
      { id: jobId, companyId },
    );
  });
}

/**
 * Fetches the job counts for a company from the ATS.
 * @param ats ATS provider key
 * @param companyId ATS company slug/id
 * @returns The total and fresh job counts for the company
 */
export async function fetchJobCounts(
  ats: ATS,
  companyId: string,
): Promise<{ total: number; fresh: number }> {
  return await withLocalTelemetryContext("Portal.FetchJobCounts", async () => {
    const jobs = await atsObj.getJobs({ id: companyId, ats }, false);
    const expiryWindow = Date.now() - JOB_EXPIRY_MS;
    const freshJobs = jobs.filter(
      ({ item: { postTS } }) => postTS >= expiryWindow,
    );
    return { total: jobs.length, fresh: freshJobs.length };
  });
}

export async function infer(
  llmAction: LLMAction,
  arg: string | Context<Bag>,
): Promise<Bag> {
  return await withLocalTelemetryContext("Portal.Infer", async () => {
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
  });
}
