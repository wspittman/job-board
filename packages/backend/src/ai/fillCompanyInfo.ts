import { z } from "zod";
import type { Company } from "../types/dbModels";
import { OrgSize, Stage, Visa } from "../types/enums";
import type { LLMContext } from "../types/types";
import { jsonCompletion } from "./openai";

const prompt = `You are a detail-oriented job seeker who excels at understanding company profiles through job descriptions.
Your goal is to extract key company insights from available context.
First, carefully review the provided company overview and sample job description to identify important company attributes.
Then, identify and extract pertinent company details.
Then, compose a concise, clear, and engaging one-line company description.
Format your response in JSON, adhering to the provided schema.`;

const schema = z.object({
  website: z
    .string()
    .nullable()
    .describe("The company's website URL, or null if not specified."),
  industry: z
    .string()
    .nullable()
    .describe(
      "The ISIC Revision 4 Section most representative of the company, or null if not specified."
    ),
  foundingYear: z
    .number()
    .nullable()
    .describe("The year the company was founded, or null if not specified."),
  stage: z
    .nativeEnum(Stage)
    .nullable()
    .describe("The stage of the company, or null if not specified."),
  size: z
    .nativeEnum(OrgSize)
    .nullable()
    .describe(
      "The lower bound of the number of employees at the company, or null if not specified."
    ),
  visa: z
    .nativeEnum(Visa)
    .nullable()
    .describe(
      "The visa sponsorship status of the company, or null if not specified."
    ),
  description: z
    .string()
    .nullable()
    .describe(
      "A concise, clear, and engaging one-line company description. Be sure to highlight key company attributes and values. If no information is available, use null."
    ),
});

export async function fillCompanyInfo(
  companyContext: LLMContext<Company>
): Promise<void> {
  const result = await jsonCompletion(
    "extractCompanyInfo",
    prompt,
    schema,
    companyContext
  );

  if (!result) return;

  throw new Error("Not Implemented");
}
