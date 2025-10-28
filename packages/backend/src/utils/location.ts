import type { Location } from "../models/models.ts";

const regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * Normalizes the given location data into a string format.
 * @param Location - The location data to normalize.
 * @returns The normalized location string.
 */
export function normalizedLocation({
  city,
  regionCode,
  countryCode,
}: Location): string {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (regionCode) {
    parts.push(regionCode);
  }

  if (countryCode) {
    try {
      parts.push(`${regionDisplayNames.of(countryCode)} (${countryCode})`);
    } catch {
      parts.push(countryCode);
    }
  }

  return parts.join(", ");
}
