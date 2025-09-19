import { jsonCompletion } from "dry-utils-openai";
import { InferredCompany } from "../models/inferredModels.ts";
import type { Company } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are a detail-oriented job seeker who excels at understanding company profiles through job descriptions.
Your goal is to extract key company insights from available context.
First, carefully review the provided company overview and sample job description to identify important company attributes.
Then, identify and extract pertinent company details.
Then, compose a concise, clear, and engaging company description paragraph.
Format your response in JSON, adhering to the provided schema.`;

/**
 * Fills in company information.
 * @param company The company object to extract data into
 * @returns True if extraction was successful, false otherwise
 */
export async function fillCompanyInfo(
  company: Context<Company>,
  model?: string
): Promise<boolean> {
  const { content } = await jsonCompletion(
    "extractCompanyInfo",
    prompt,
    company.item,
    InferredCompany,
    { context: company.context, model }
  );

  if (content) {
    setExtractedData(company.item, content);
  }

  return !!content;
}
