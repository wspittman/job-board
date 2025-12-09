import type { Bag } from "../types/types.ts";

/**
 * Remove properties with null or undefined values from an object.
 * Only top-level properties are processed, nested objects are not affected.
 * @param obj - The object to strip
 * @returns The stripped object
 */
export function stripObj<T extends Bag>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, val]) => val != null)
  ) as T;
}
