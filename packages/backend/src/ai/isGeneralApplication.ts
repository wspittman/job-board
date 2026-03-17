import { jsonCompletion, z } from "dry-utils-openai";
import { getLLMOptions } from "../config.ts";

const prompt = `A "general-application" Job Description (JD) allows candidates to apply when there is no specific open role. It is usually broad and flexible.

Indications of a general-application JD:
- Talent Pool building: "Talent Community", "Talent Network", "Talent Pool", "Join our Talent Pool as a Designer", "Software Engineer Talent Pool"
- General (non-specific) roles: "General Application", "General Interest", "General Submission", "Expression of Interest", "Expression of Interest - Talent Acquisition", "Other Careers"
- Future roles: "Future Consideration", "Future Opportunities", "Demand Analyst (Future Consideration)", "Future Opportunities - Sales"
- Company connection: "Connect with [Company]", "Join [Company]", "Apply to us"
- No role matches: "Didn't See What You Are Looking For?", "Create your own job description", "My Role is not listed here"
- The above phrases when combined with a job function or title: 

Contrary indications (not general-application):
- Internships: "General Engineering Internship", "Business Development Intern"
- Specific roles that include the word "general": "Founding Demand Generation", "HR Operations Generalist", "Junior Consultant - Generalist"
- Specific recruiting roles that include the word "talent": "Talent Acquisition, USA", "Talent Agent", "Talent Strategist"

Your task:
- You will be provided a JD title.
- If the title indicates a general-application JD, respond with { result: true }.
- Respond with { result: false } if it does not.
`;

/**
 * Determines if a job title indicates a general-application job description.
 * @param title - The job title to evaluate.
 * @returns True if the title indicates a general-application JD, false otherwise.
 */
export async function isGeneralApplication(title: string): Promise<boolean> {
  const { content } = await jsonCompletion(
    "isGeneralApplication",
    prompt,
    title,
    z.object({ result: z.boolean() }),
    getLLMOptions("isGeneralApplication"),
  );

  return content?.result ?? false;
}
