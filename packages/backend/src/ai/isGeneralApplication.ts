import { jsonCompletion, z } from "dry-utils-openai";

const prompt = `Below are example titles for “general-application” Job Descriptions (JDs). These JDs are not tied to a specific open role; their purpose is to collect resumes, maintain a talent community, or provide updates about current and future opportunities.

Examples of titles that *do* indicate a general-application JD:
- "Submit Your Application for Future Consideration"
- "General Interest - PcD"
- "No roles that match our current openings? We still want to hear from you—join the [COMPANY] Talent Community!"
- "Create your own job description"
- "Join [COMPANY]"
- "Talent pool"
- "Build the Future with Us! | [COMPANY] Talent Community"
- "Join Our Talent Community"
- "Engineering (General Application)"
- "Future Opportunities with [COMPANY] Companies"
- "General Submission"
- "Don’t see what you’re looking for?"
- "Join our Talent Community!"
- "Styling Talent Community- Join Today!"
- "Future Opportunities: Senior Recruiter"
- "Join Our Community"
- "General Applications"

**Your task:**
The user will provide additional JD titles.
Respond with { result: true } if the title indicates a general-application JD.
Respond with { result: false } if it does not.
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
    {
      // Always cheap model since this is a simple classification task
      model: "gpt-5-nano",
      reasoningEffort: "minimal",
    }
  );

  return content?.result ?? false;
}
