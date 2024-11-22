import { Job } from "../db/models";
import { batchRun } from "../utils/async";
import { jsonCompletion } from "./llm";

const facetPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job description that is provided. Then extract facets from the data. Then compose a one-line summary of the job description.
Provide the response JSON in the provided schema.`;

type Facets = Job["facets"] | undefined;

interface FacetSchema {
  summary: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  isHourly?: boolean;
  experience?: number;
}

const facetSchema = {
  name: "facet_schema",
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "A resume-style one-line summary of the role's responsibilities. Be concise and focus on the most important aspects. Do not repeat the company or job title.",
      },
      minSalary: {
        type: ["number", "null"],
        description: "Minimum salary for the job, or null if not specified.",
      },
      maxSalary: {
        type: ["number", "null"],
        description: "Maximum salary for the job, or null if not specified.",
      },
      currency: {
        type: ["string", "null"],
        description:
          "Currency of the salary in ISO currency codes, or null if not specified.",
      },
      isHourly: {
        type: "boolean",
        description: "True if the job is paid hourly, false otherwise.",
      },
      experience: {
        type: ["number", "null"],
        description:
          "Minimum years of experience required for the role, or null if not specified.",
      },
    },
    additionalProperties: false,
  },
};

export async function extractFacets(texts: string[]): Promise<Facets[]> {
  const withIndex = texts.map((text, index) => ({
    index,
    text,
  }));
  const results: Facets[] = [];

  await batchRun(withIndex, async ({ index, text }) => {
    const result = await jsonCompletion<FacetSchema>(
      "extractFacets",
      facetPrompt,
      facetSchema,
      text
    );

    if (result) {
      const facets = formatFacets(result);
      console.debug(`AI.extractFacets`, facets);
      results[index] = facets;
    } else {
      console.debug(`AI.extractFacets = undefined`);
    }
  });

  return results;
}

function formatFacets(facets: FacetSchema): Facets {
  const includeSalary = facets.currency === "USD" && !facets.isHourly;
  return {
    summary: facets.summary,
    salary: includeSalary ? facets.minSalary : undefined,
    experience: facets.experience,
  };
}
