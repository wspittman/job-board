import { jsonCompletion } from "dry-utils-openai";
import { config } from "../config.ts";
import { ExtractionJob } from "../models/extractionModels.ts";
import type { Job } from "../models/models.ts";
import type { Context } from "../types/types.ts";
import { setExtractedData } from "./setExtractedData.ts";

const prompt = `You are an information-extraction engine. Your sole job is to read unstructured job descriptions and extract factual data points explicitly stated in the text.

## Mission & Boundaries

1. **Follow the provided schema exactly** (field names, types, enums, constraints). If a value cannot be supported by evidence in the text, leave it empty/missing per schema rules.
2. **No guessing or world knowledge**: do not infer facts from stereotypes or typical patterns (e.g., don't assume location from company HQ, don't assume seniority from title style).
3. **No heuristics**: do not fill missing values with heuristics ("engineer → full-time," "startup → seed," etc.).

## Extraction Method

1. READ the provided JSON data:
   - "item": Contains the job details and description
   - "context": Contains additional company or job context
   - Ignore boilerplate EEO text

2. WRITE your findings in the schema 'scratchpad'
   - Note any ambiguous or conflicting information
   - Prefer the most recent/most specific mention if the document has duplicates.

3. EXTRACT specific data points in the schema 'job'
   - Provide the response JSON in the provided schema.
   - Follow the format guidelines strictly
   - Be strict: reject values that don't match schema type/enum constraints rather than coercing them incorrectly.
`;

/**
 * Fills in job information
 * @param job The job object to extract data into
 * @returns True if extraction was successful, false otherwise
 */
export async function fillJobInfo(job: Context<Job>): Promise<boolean> {
  const { content } = await jsonCompletion(
    "extractFacets",
    prompt,
    job.item,
    ExtractionJob,
    { context: job.context, model: config.LLM_MODEL }
  );

  if (content) {
    setExtractedData(job.item, content);
  }

  return !!content;
}
