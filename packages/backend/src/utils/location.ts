import type { Location } from "../models/models.ts";

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
  const intlNames = new Intl.DisplayNames(["en"], { type: "region" });

  if (city) {
    parts.push(city);
  }

  if (regionCode) {
    parts.push(`${intlNames.of(regionCode)} (${regionCode})`);
  }

  if (countryCode) {
    parts.push(`${intlNames.of(countryCode)} (${countryCode})`);
  }

  return parts.join(", ");
}
