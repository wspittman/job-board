import { z } from "zod";
import type { Job } from "../types/dbModels";
import { Education, JobType, Office, PayRate } from "../types/enums";
import type { LLMContext } from "../types/types";
import { zBoolean, zEnum, zNumber, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const prompt = `You are a detail-oriented job seeker who excels at identifying key insights from job descriptions.
Your goal is to extract essential job facets from the provided job description.
First, carefully review the job description to identify important role-specific attributes and requirements.
Then, identify and extract relevant job details.
Finally, compose a concise, clear, and engaging one-line summary of the job.
Format your response in JSON, adhering to the provided schema.`;

const schema = z.object({
  locations: z
    .array(
      z.object({
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
      })
    )
    .describe(
      "Location details, determined to the extent possible, for all listed work locations or regions. Use null for any unspecified fields."
    ),
  compensation: z
    .object({
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
    })
    .describe(
      "Compensation details, determined to the extent possible. Use null for any unspecified fields."
    ),
  role: z
    .object({
      education: zEnum(
        Education,
        "The minimum education level required for the role."
      ),
      experience: zNumber(
        "The minimum years of experience required for the role."
      ),
      function: zString("The O*NET Job Family most representative of the job."),
      type: zEnum(JobType, "The type of job."),
      skills: z.array(
        zString("Up to five key skills required for and specific to this role.")
      ),
      travelRequired: zBoolean("True if travel is required for the role."),
      manager: zBoolean("True if the role is a management position."),
    })
    .describe(
      "Role details, determined to the extent possible. Use null for any unspecified fields."
    ),
  summary: z
    .object({
      role: zString(
        "A one-line summary of the role and responsibilities. Emphasize the core duties, required skills, and team dynamics of the position."
      ),
      impact: zString(
        "A one-line summary of the impact the role. Highlight the role's measurable impact on the company, customers or industry."
      ),
      growth: zString(
        "A one-line summary of the growth opportunities the role provides. Showcase opportunities for learning, innovation, and industry relevance."
      ),
    })
    .describe(
      "Concise, clear, and engaging summaries of different aspects of the job. Be concise and do not repeat the company or job title. Use null for if insufficient information is available."
    ),
});

export async function fillJobInfo(jobContext: LLMContext<Job>): Promise<void> {
  const result = await jsonCompletion(
    "extractJobInfo",
    prompt,
    schema,
    jobContext
  );

  if (!result) return;

  setExtractedData(jobContext.item, result);
}
