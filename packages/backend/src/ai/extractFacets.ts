import { Job } from "../types/dbModels";
import { BatchOptions, batchRun } from "../utils/async";
import { jsonCompletion } from "./openai";

const facetPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job description that is provided. Then extract facets from the data. Then compose a one-line summary of the job description.
Provide the response JSON in the provided schema.`;

type Facets = Job["facets"];
type FacetResult = Facets | undefined;

const facetSchema = {
  name: "facet_schema",
  schema: {
    type: "object",
    properties: {
      minPayRate: {
        type: ["number", "null"],
        description: "Minimum pay rate for the job, or null if not specified.",
      },
      maxPayRate: {
        type: ["number", "null"],
        description: "Maximum pay rate for the job, or null if not specified.",
      },
      currency: {
        type: ["string", "null"],
        description:
          "Currency of the pay in ISO 4217 currency code, or null if not specified.",
      },
      payType: {
        type: ["string", "null"],
        description:
          "The type of payment arrangement, one of ['hourly', 'salary', 'stipend', 'OTE'], or null if not specified.",
      },
      experience: {
        type: ["number", "null"],
        description:
          "Minimum years of experience required for the role, or null if not specified.",
      },
      industry: {
        type: ["string", "null"],
        description:
          "The ISIC Revision 4 Section most representative of the company, or null if not specified.",
      },
      function: {
        type: ["string", "null"],
        description:
          "The O*NET Job Family most representative of the job, or null if unclear.",
      },
      jobType: {
        type: ["string", "null"],
        description:
          "The type of job, one of ['Full Time', 'Part Time', 'Contract', 'Temporary', 'Internship'], or null if not specified.",
      },
      summary: {
        type: "string",
        description:
          "A resume-style one-line summary of the role's responsibilities. Be concise and focus on the most important aspects. Do not repeat the company or job title.",
      },
    },
    additionalProperties: false,
  },
};

export async function extractFacets(
  texts: string[],
  batchOpts: BatchOptions
): Promise<FacetResult[]> {
  const withIndex = texts.map((text, index) => ({
    index,
    text,
  }));
  const results: FacetResult[] = [];

  await batchRun(
    withIndex,
    async ({ index, text }) => {
      const result = await jsonCompletion<Facets, FacetResult>(
        "extractFacets",
        facetPrompt,
        facetSchema,
        text,
        formatFacets
      );

      if (result) {
        results[index] = result;
      }
    },
    "ExtractFacets",
    batchOpts
  );

  return results;
}

function formatFacets(facets: Facets): Facets {
  const includeSalary =
    facets.currency === "USD" && facets.payType === "salary";
  return {
    ...facets,
    salary: includeSalary ? facets.minPayRate : undefined,
  };
}
