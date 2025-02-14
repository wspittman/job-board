import { z } from "zod";

type ZObj = Record<string, z.ZodType>;

/** Creates a nullable boolean Zod schema with a description. */
export const zBoolean = (desc: string) => z.boolean().nullable().describe(desc);

/** Creates a nullable enum Zod schema with a description. */
export const zEnum = <T extends z.EnumLike>(v: T, desc: string) =>
  z.nativeEnum(v).nullable().describe(describeEnum(v, desc));

/** Creates a nullable number Zod schema with a description. */
export const zNumber = (desc: string) => z.number().nullable().describe(desc);

/** Creates a nullable string Zod schema with a description. */
export const zString = (desc: string) => z.string().nullable().describe(desc);

/** Creates a Zod object schema with a description. */
export const zObj = <T extends ZObj>(desc: string, schema: T) =>
  z.object(schema).describe(desc);

/** Creates a Zod array schema containing objects, with a description. */
export const zObjArray = <T extends ZObj>(desc: string, schema: T) =>
  z.array(z.object(schema)).describe(desc);

function describeEnum<T extends z.EnumLike>(v: T, desc: string) {
  if (isStringEnum(v)) {
    return desc;
  }

  // Pipe the full enum description since OpenAI only receives the enum values
  const entries = Object.entries(v)
    // Filter out numeric keys, since TS maps both ways
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  return `${desc}. Possible values: [${entries}]`;
}

const isStringEnum = (v: z.EnumLike) =>
  Object.values(v).every((value) => typeof value === "string");
