import {
  jsonCompletion,
  zEnum,
  zNumber,
  zObj,
  zString,
} from "@dry-utils/openai";
import type { Company } from "../types/dbModels.ts";
import { Industry, Stage, Visa } from "../types/enums.ts";
import type { Context } from "../types/types.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are a detail-oriented job seeker who excels at understanding company profiles through job descriptions.
Your goal is to extract key company insights from available context.
First, carefully review the provided company overview and sample job description to identify important company attributes.
Then, identify and extract pertinent company details.
Then, compose a concise, clear, and engaging company description paragraph.
Format your response in JSON, adhering to the provided schema.`;

const schema = zObj(
  "Company attributes. Use null for any property for which information is not available.",
  {
    website: zString(
      "The company's website homepage URL. Do not use the ATS URL (eg. *.lever.co or *.greenhouse.io)."
    ),
    industry: zEnum(
      Industry,
      "The industry in which the company operates. Avoid using 'Technology & Software' if a different option is valid. Select 'Other' if no other option is a strong match. Select null if insufficient information to decide."
    ),
    foundingYear: zNumber("The year the company was founded."),
    stage: zEnum(
      Stage,
      "The stage of the company. Only include if a stage marked is explicitly mentioned, such as 'Seed Stage', 'Series A', 'Bootstrapped', 'Public', or 'NonProfit'. Do not infer based on other attributes, including the word 'startup' or indications of how much investment money has been raised."
    ),
    size: zNumber(
      "The lower bound of the number of employees at the company. Only include if explicitly mentioned. Do not infer based on other attributes."
    ),
    visa: zEnum(
      Visa,
      "The visa sponsorship status of the company. Only include if the word 'visa' is explicitly mentioned. Do not infer based on other attributes."
    ),
    description: zString(
      "A concise, clear, and engaging company description paragraph. Be sure to highlight key company attributes and values. Only include information that is specifically about the company. Avoid mentioning information that pertains only to the example role."
    ),
  }
);

/**
 * Fills in company information.
 * @param company The company object to extract data into
 * @returns True if extraction was successful, false otherwise
 */
export async function fillCompanyInfo(
  company: Context<Company>
): Promise<boolean> {
  const { content } = await jsonCompletion(
    "extractCompanyInfo",
    prompt,
    company.item,
    schema,
    { context: company.context }
  );

  if (content) {
    setExtractedData(company.item, content);
  }

  return !!content;
}
