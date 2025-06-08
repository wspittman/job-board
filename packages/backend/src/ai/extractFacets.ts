import {
  jsonCompletion,
  z,
  zBoolean,
  zEnum,
  zNumber,
  zObj,
  zString,
} from "dry-utils-openai";
import type { Job, Location } from "../types/dbModels.ts";
import { Office } from "../types/enums.ts";
import type { Context } from "../types/types.ts";
import { normalizedLocation } from "../utils/location.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are an AI assistant specialized in analyzing job listings. Your task is to extract key information from job descriptions systematically.

PROCESS:
1. READ the provided JSON data:
   - "item": Contains the job details and description
   - "context": Contains additional company or job context

2. ANALYZE the following aspects in order:
   - Compensation details
   - Location and work arrangement
   - Experience requirements
   - Key responsibilities

3. WRITE your findings in the scratchpad
   - Use bullet points for clarity
   - Focus on explicit statements, avoid assumptions
   - Note any ambiguous or conflicting information

4. EXTRACT specific data points according to the schema
   - Only include information explicitly stated
   - Use null for uncertain or unspecified fields
   - Follow the format guidelines strictly

5. SUMMARIZE the role in one line
   - Focus on key responsibilities
   - Be specific but concise
   - Avoid mentioning company name or job title

Provide the response JSON in the provided schema.
`;

const schema = z.object({
  scratchpad: zObj(
    "Document your analysis of compensation and location details here. Use this space to think carefully.",
    {
      compensation: zString("List all monetary compensation details."),
      location: zString(
        "List work location details including office location, remote policy, and time zone requirements. The 'location' section of the Job object takes precedence over the job description."
      ),
    }
  ),
  minSalary: zNumber("Minimum annual salary. Use null if not specified."),
  maxSalary: zNumber("Maximum annual salary. Use null if not specified."),
  currency: zString(
    "Three-letter ISO currency code. Example: 'USD', 'EUR', 'GBP'. Use null if not specified."
  ),
  isHourly: zBoolean(
    "true = hourly rate specified, false = annual salary or unspecified"
  ),
  experience: zNumber(
    "Minimum years of required experience. Use the lower number when given a range. Example: 5 for '5-8 years'. Use null if not explicitly stated."
  ),
  location: zObj(
    "Extract location details based on explicit information. The 'location' section of the Job object takes precedence over the job description.",
    {
      remote: zEnum(
        Office,
        "Categorize as: 'Remote' for fully remote roles, 'Hybrid' for partial office attendance, 'OnSite' for full office attendance. A role is 'Remote' if only a region is mentioned (eg. 'USA' or 'Pacific Time Zone'). A role is 'Remote' if the location description includes the string 'remote'. A role is 'Hybrid' only if the word 'hybrid' is explicitly used. Never use null, always make a selection."
      ),
      city: zString(
        "City name in English. Use null if only country/region is specified."
      ),
      state: zString(
        "Full state/province name in English. Use null if not applicable."
      ),
      stateCode: zString(
        "ISO 3166-2 subdivision code. Examples: 'WA' for Washington, 'TX' for Texas, 'ON' for Ontario. Use null if not applicable."
      ),
      country: zString(
        "ISO 3166 English short name of the country. Examples: 'United States of America', 'Canada', 'Mexico'. Use null for global remote roles."
      ),
      countryCode: zString(
        "ISO 3166-1 alpha-3 country code. Examples: 'USA' for the United States of America, 'CAN' for Canada, 'MEX' for Mexico. Use null for global remote roles."
      ),
    }
  ),
  summary: zString(
    "Single sentence focusing on key responsibilities. Use active voice and specific technologies/skills. Do not repeat the company or job title."
  ),
});

/**
 * Extracts facets from and update a job object.
 * @param job The job object
 */
export async function extractFacets(
  job: Context<Job>,
  model?: string
): Promise<void> {
  const { content } = await jsonCompletion(
    "extractFacets",
    prompt,
    job.item,
    schema,
    { context: job.context, model }
  );

  if (!content) return;

  // Temporary Reformatting Holdover
  const includeSalary = content.currency === "USD" && !content.isHourly;
  const formattedResult = {
    summary: content.summary,
    salary: includeSalary ? content.minSalary : undefined,
    experience: content.experience,
  };

  setExtractedData(job.item.facets, formattedResult);

  // Also Temporary Reformatting Holdover
  const location: Location = {};
  setExtractedData(location, content.location);
  job.item.isRemote = location.remote === Office.Remote;
  job.item.location = normalizedLocation(location);
}
