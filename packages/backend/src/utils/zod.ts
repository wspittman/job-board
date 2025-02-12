import { z } from "zod";

type ZObj = Record<string, z.ZodType>;

export const zBoolean = (desc: string) => z.boolean().nullable().describe(desc);
export const zEnum = <T extends z.EnumLike>(v: T, desc: string) =>
  z.nativeEnum(v).nullable().describe(desc);
export const zNumber = (desc: string) => z.number().nullable().describe(desc);
export const zString = (desc: string) => z.string().nullable().describe(desc);

export const zObj = <T extends ZObj>(desc: string, schema: T) =>
  z.object(schema).describe(desc);
export const zObjArray = <T extends ZObj>(desc: string, schema: T) =>
  z.array(z.object(schema)).describe(desc);
