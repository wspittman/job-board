import type { Company } from "../types/dbModels";
import { OrgSize, Stage, Visa } from "../types/enums";
import type { Context } from "../types/types";
import { zEnum, zNumber, zObj, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

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
  industry: zString(
      "The ISIC Revision 4 Section most representative of the company. Only include the name (eg. 'Agriculture, Forestry and Fishing'), not the number (eg. 'A01')"
  ),
    foundingYear: zNumber("The year the company was founded."),
    stage: zEnum(
      Stage,
      "The stage of the company. Only include if explicitly mentioned. Do not infer based on other attributes."
    ),
  size: zEnum(
    OrgSize,
      "The lower bound of the number of employees at the company. Only include if explicitly mentioned. Do not infer based on other attributes."
  ),
  visa: zEnum(
    Visa,
      "The visa sponsorship status of the company. Only include if 'visa' is explicitly mentioned. Do not infer based on other attributes."
  ),
  description: zString(
      "A concise, clear, and engaging company description paragraph. Be sure to highlight key company attributes and values."
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
  const result = await jsonCompletion(
    "extractCompanyInfo",
    prompt,
    schema,
    company
  );

  if (result) {
    setExtractedData(company.item, result);
  }

  return !!result;
}
