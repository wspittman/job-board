import { z } from "zod";
import type { Company } from "../types/dbModels";
import { OrgSize, Stage, Visa } from "../types/enums";
import type { Context } from "../types/types";
import { zEnum, zNumber, zString } from "../utils/zod";
import { jsonCompletion, setExtractedData } from "./openai";

const prompt = `You are a detail-oriented job seeker who excels at understanding company profiles through job descriptions.
Your goal is to extract key company insights from available context.
First, carefully review the provided company overview and sample job description to identify important company attributes.
Then, identify and extract pertinent company details.
Then, compose a concise, clear, and engaging company description paragraph.
Format your response in JSON, adhering to the provided schema.`;

const schema = z.object({
  website: zString("The company's website URL, or null if not specified."),
  industry: zString(
    "The ISIC Revision 4 Section most representative of the company, or null if not specified."
  ),
  foundingYear: zNumber(
    "The year the company was founded, or null if not specified."
  ),
  stage: zEnum(Stage, "The stage of the company, or null if not specified."),
  size: zEnum(
    OrgSize,
    "The lower bound of the number of employees at the company, or null if not specified."
  ),
  visa: zEnum(
    Visa,
    "The visa sponsorship status of the company, or null if not specified."
  ),
  description: zString(
    "A concise, clear, and engaging company description paragraph. Be sure to highlight key company attributes and values. If no information is available, use null."
  ),
});

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
