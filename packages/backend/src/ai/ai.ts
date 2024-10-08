import OpenAI from "openai";

const client = new OpenAI();

const locationPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or on-site. Provide the response in the following JSON format, using empty string ("") for any unknown fields.
<format>
{
remote: boolean,
city: string,
state: string,
country: string,
}
</format>
In this context, "remote" should only be true for full remote jobs. If the job is hybrid or on-site, it should be false.
In this context, "state" is shorthand for state, province, or similar.
When well-known acronyms exist, always use the full name with the acronym in parentheses. For example, "Washington (WA)" or "United States of America (USA)".`;

export async function extractLocation(locationText: string) {
  const f = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: locationPrompt,
      },
      {
        role: "user",
        content: `<location>${locationText}</location>`,
      },
    ],
    // TBD: Switch to json_schema once it is supported with Azure gpt-4o-mini
    response_format: { type: "json_object" },
  });
  console.log(`tokens: ${f.usage?.total_tokens}`);
  console.log(f.choices[0].message);
}
