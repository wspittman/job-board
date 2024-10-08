import OpenAI from "openai";

const client = new OpenAI();

const locationPrompt = `You are an experienced job seeker whose goal is to quickly find relevant information from job descriptions.
First, read the job location text that is provided. Then decide if the job is intended to be remote or hybrid/on-site. Then decide where the job is based to the extent possible, regardless of whether it is remote or hybrid/on-site.
Provide the response JSON, using empty string ("") for any unknown fields.`;

const locationSchema = {
  name: "location_schema",
  schema: {
    type: "object",
    properties: {
      remote: {
        type: "boolean",
        description: "true for full remote jobs",
      },
      city: { type: "string", description: "city name" },
      state: {
        type: "string",
        description: "state, province, or similar name",
      },
      stateAcronym: {
        type: "string",
        description: "Well-known acronym for the `state` field, if one exists",
      },
      country: { type: "string", description: "country name" },
      countryAcronym: {
        type: "string",
        description:
          "Well-known acronym for the `country` field, if one exists",
      },
    },
    additionalProperties: false,
  },
};

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
    response_format: {
      type: "json_schema",
      json_schema: locationSchema,
    },
  });
  console.log(`tokens: ${f.usage?.total_tokens}`);
  console.log(f.choices[0].message);
}
