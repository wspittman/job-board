import { z } from "zod";
import type { Job, Location } from "../types/dbModels";
import { Office } from "../types/enums";
import type { Context } from "../types/types";
import { normalizedLocation } from "../utils/location";
import { zBoolean, zEnum, zNumber, zObj, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const prompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the provided data: An initial job object, including job description, and any additional context.
Then extract facets from the data.
Then compose a one-line summary of the job description.
Provide the response JSON in the provided schema.`;

const schema = z.object({
  minSalary: zNumber("Minimum salary for the job, or null if not specified."),
  maxSalary: zNumber("Maximum salary for the job, or null if not specified."),
  currency: zString(
    "Currency of the salary in ISO currency codes, or null if not specified."
  ),
  isHourly: zBoolean("True if the job is paid hourly, false otherwise."),
  experience: zNumber(
    "Minimum years of experience explicitly required for the role, or null if not specified."
  ),
  location: zObj(
    "Location details, determined to the extent possible. Use null for any unspecified fields.",
    {
      remote: zEnum(Office, "The remote status of this location."),
      city: zString("City name"),
      state: zString(
        "The full English name for the state, province, or subdivision."
      ),
      stateCode: zString(
        "The ISO 3166-2 subdivision code for the subdivision. Examples: 'WA' for Washington, 'TX' for Texas, 'ON' for Ontario."
      ),
      country: zString(
        "The ISO 3166 English short name of the country. Examples: 'United States of America', 'Canada', 'Mexico'."
      ),
      countryCode: zString(
        "The ISO 3166-1 alpha-3 three-letter code for the country. Examples: 'USA' for the United States of America, 'CAN' for Canada, 'MEX' for Mexico."
      ),
    }
  ),
  summary: zString(
    "A resume-style one-line summary of the role's responsibilities. Be concise and focus on the most important aspects. Do not repeat the company or job title."
  ),
});

/**
 * Extracts facets from and update a job object.
 * @param job The job object
 */
export async function extractFacets(job: Context<Job>): Promise<void> {
  const result = await jsonCompletion("extractFacets", prompt, schema, job);

  if (!result) return;

  // Temporary Reformatting Holdover
  const includeSalary = result.currency === "USD" && !result.isHourly;
  const formattedResult = {
    summary: result.summary,
    salary: includeSalary ? result.minSalary : undefined,
    experience: result.experience,
  };

  setExtractedData(job.item.facets, formattedResult);

  // Also Temporary Reformatting Holdover
  const location: Location = {};
  setExtractedData(location, result.location);
  job.item.isRemote = location.remote === Office.Remote;
  job.item.location = normalizedLocation(location);
}
