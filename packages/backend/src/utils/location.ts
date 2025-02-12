import type { Location } from "../types/dbModels";

export function normalizedLocation({
  city,
  state,
  stateCode,
  country,
  countryCode,
}: Location): string {
  const parts: string[] = [];

  if (city) {
    parts.push(city);
  }

  if (state || stateCode) {
    if (state && stateCode) {
      parts.push(`${state} (${stateCode})`);
    } else {
      parts.push(state || stateCode!);
    }
  }

  if (country || countryCode) {
    if (country && countryCode) {
      parts.push(`${country} (${countryCode})`);
    } else {
      parts.push(country || countryCode!);
    }
  }

  return parts.join(", ");
}
