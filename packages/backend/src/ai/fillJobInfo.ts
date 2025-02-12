import { z } from "zod";
import type { Job } from "../types/dbModels";
import { Education, JobType, Office, PayRate } from "../types/enums";
import type { Context } from "../types/types";
import {
  zBoolean,
  zEnum,
  zNumber,
  zObj,
  zObjArray,
  zString,
} from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const prompt = `You are a detail-oriented job seeker who excels at identifying key insights from job descriptions.
Your goal is to extract essential job details from the provided job description.
First, carefully review the job description to identify important role-specific attributes and requirements.
Then, identify and extract relevant job details.
Finally, compose a concise, clear, and engaging one-sentence summaries focused on different aspects of the job.
Format your response in JSON, adhering to the provided schema.`;

const schema = z.object({
  locationList: zObjArray(
    "Location details, determined to the extent possible, for all listed work locations or regions. Use null for any unspecified fields.",
    {
      remote: zEnum(Office, "The remote status of this location."),
      city: zString("City name."),
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
      timezone: zString("The IANA timezone identifier for the location."),
    }
  ),
  historyList: zObjArray(
    "Candidate experience and education requirements for the role. Include multiple entries when different experience is required for different education levels. Use null for any unspecified fields.",
    {
      education: zEnum(
        Education,
        "The minimum education level required to be considered for the role."
      ),
      experience: zNumber(
        "The minimum years of experience required to be considered for the role."
      ),
    }
  ),
  role: zObj(
    "Role details, determined to the extent possible. Use null for any unspecified fields.",
    {
      function: zString("The O*NET Job Family most representative of the job."),
      type: zEnum(JobType, "The type of job."),
      skills: z
        .array(zString("A key skill required for and specific to this role."))
        .describe("A list of up to five key skills required for the role."),
      travelRequired: zBoolean("True if travel is required for the role."),
      manager: zBoolean("True if the role is a management position."),
    }
  ),
  compensation: zObj(
    "Compensation details, determined to the extent possible. Use null for any unspecified fields.",
    {
      rate: zEnum(PayRate, "The type of payment arrangement."),
      min: zNumber("Minimum pay rate for the job."),
      max: zNumber("Maximum pay rate for the job."),
      currency: zString("Currency of the pay in ISO 4217 currency code."),
      hasEquity: zBoolean("True if the job includes equity compensation"),
      pto: z
        .union([zNumber("Number of PTO days"), z.literal("Unlimited")])
        .describe(
          "The number of paid time off days, or 'Unlimited' if role provides an unlimited PTO benefit."
        ),
    }
  ),
  summary: zObj(
    "Concise, clear, and engaging summaries of different aspects of the job. Be concise and do not repeat the company or job title. Use null if insufficient information is available.",
    {
      role: zString(
        "A one-sentence summary of the role and responsibilities. Emphasize the core duties, required skills, and team dynamics of the position."
      ),
      impact: zString(
        "A one-sentence summary of the impact the role. Highlight the role's measurable impact on the company, customers or industry."
      ),
      growth: zString(
        "A one-sentence summary of the growth opportunities the role provides. Showcase opportunities for learning, innovation, and industry relevance."
      ),
    }
  ),
});

export async function fillJobInfo(job: Context<Job>): Promise<boolean> {
  const result = await jsonCompletion("extractJobInfo", prompt, schema, job);

  if (result) {
    setExtractedData(job.item, dealWithMultiples(result));
  }

  return !!result;
}

function dealWithMultiples({
  locationList = [],
  historyList = [],
  ...rest
}: z.infer<typeof schema>) {
  const locationHasMultiple = locationList.length > 1;
  const historyHasMultiple = historyList.length > 1;

  // TBD: Also need location normalization

  const adjust = {
    location: locationHasMultiple ? null : locationList[0],
    locationList: locationHasMultiple ? locationList : null,
    locationHasMultiple: locationHasMultiple,
    history: historyHasMultiple ? null : historyList[0],
    historyList: historyHasMultiple ? historyList : null,
    historyHasMultiple: historyHasMultiple,
  };

  return {
    ...adjust,
    ...rest,
  };
}
