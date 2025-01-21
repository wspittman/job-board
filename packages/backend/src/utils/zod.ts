import { z } from "zod";

export const zBoolean = (desc: string) => z.boolean().nullable().describe(desc);
export const zEnum = <T extends z.EnumLike>(v: T, desc: string) =>
  z.nativeEnum(v).nullable().describe(desc);
export const zNumber = (desc: string) => z.number().nullable().describe(desc);
export const zString = (desc: string) => z.string().nullable().describe(desc);
