import type { Location } from "../models/models.ts";

/**
 * Normalizes the given location data into a string format.
 * @param Location - The location data to normalize.
 * @returns The normalized location string.
 */
export function normalizedLocation({ city, regionCode }: Location): string {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (regionCode) {
    parts.push(regionCode);
  }

  return parts.join(", ");
}
