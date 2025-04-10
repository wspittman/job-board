import type { z } from "dry-utils-openai";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : Exclude<T[P], null>;
};

/**
 * Fill a parent item with extracted data from matching keys in the LLM completion.
 * Ignores any undefined/null values in the completion object.
 * The typing is wild here but this function saves us a lot of boilerplate.
 * @param item The parent object to update with extracted data
 * @param completion The LLM completion object containing the extracted data
 */
export function setExtractedData<
  Item extends object,
  Schema extends z.ZodType,
  Key extends keyof Item & keyof z.infer<Schema>
>(item: Item, completion: Pick<z.infer<Schema>, Key>) {
  // Note: Assign isn't recursive, so top-level objects will be replaced
  Object.assign(item, removeNulls(completion));
}

function removeNulls<T extends object>(val: T): DeepPartial<T> | undefined {
  if (typeof val !== "object" || val == null) return val;

  if (Array.isArray(val)) {
    const cleanArray = val.map(removeNulls).filter(Boolean);
    return cleanArray.length ? (cleanArray as DeepPartial<T>) : undefined;
  }

  const entries = Object.entries(val)
    .map(([key, value]) => [key, removeNulls(value)])
    .filter(([_, value]) => value != null);

  return entries.length ? Object.fromEntries(entries) : undefined;
}
