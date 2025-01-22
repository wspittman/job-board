import { z } from "zod";
import type { Job } from "../types/dbModels";
import { zBoolean, zNumber, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const prompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job description that is provided. Then extract facets from the data. Then compose a one-line summary of the job description.
Provide the response JSON in the provided schema.`;

const schema = z.object({
  minSalary: zNumber("Minimum salary for the job, or null if not specified."),
  maxSalary: zNumber("Maximum salary for the job, or null if not specified."),
  currency: zString(
    "Currency of the salary in ISO currency codes, or null if not specified."
  ),
  isHourly: zBoolean("True if the job is paid hourly, false otherwise."),
  experience: zNumber(
    "Minimum years of experience required for the role, or null if not specified."
  ),
  summary: zString(
    "A resume-style one-line summary of the role's responsibilities. Be concise and focus on the most important aspects. Do not repeat the company or job title."
  ),
});

/**
 * Extracts facets from and update a job object.
 * @param job The job object
 */
export async function extractFacets(job: Job): Promise<void> {
  const result = await jsonCompletion("extractFacets", prompt, schema, job);

  if (!result) return;

  // Temporary Reformatting Holdover
  const includeSalary = result.currency === "USD" && !result.isHourly;
  const formattedResult = {
    summary: result.summary,
    salary: includeSalary ? result.minSalary : undefined,
    experience: result.experience,
  };

  setExtractedData(job.facets, formattedResult);
}
