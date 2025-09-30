import type { DeepPartialNullToUndef } from "../types/types.ts";

const nullRegex = new RegExp(/^[^a-zA-Z0-9]*null[^a-zA-Z0-9]*$/);
const undefinedRegex = new RegExp(/^[^a-zA-Z0-9]*undefined[^a-zA-Z0-9]*$/);

/**
 * Fill a parent item with extracted data from matching keys in the LLM completion.
 * Ignores any undefined/null values in the completion object.
 * The typing is wild here but this function saves us a lot of boilerplate.
 * @param item The parent object to update with extracted data
 * @param completion The LLM completion object containing the extracted data
 */
export function setExtractedData(item: object, completion: object) {
  // Note: Assign isn't recursive, so top-level objects will be replaced
  Object.assign(item, removeNulls(completion));
}

function removeNulls(v: unknown): DeepPartialNullToUndef<unknown> | undefined {
  if (v == null) return undefined;

  if (typeof v === "string") {
    const altV = v.trim().toLowerCase();
    if (!altV || nullRegex.test(altV) || undefinedRegex.test(altV)) {
      return undefined;
    }
    return v.trim();
  }

  if (typeof v !== "object") return v;

  if (Array.isArray(v)) {
    const cleanArray = v.map(removeNulls).filter(Boolean);
    return cleanArray.length
      ? (cleanArray as DeepPartialNullToUndef<unknown>)
      : undefined;
  }

  const entries = Object.entries(v)
    .map(([key, value]) => [key, removeNulls(value)])
    .filter(([_, value]) => value != undefined);

  return entries.length ? Object.fromEntries(entries) : undefined;
}
