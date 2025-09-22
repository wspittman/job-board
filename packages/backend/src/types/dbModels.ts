/**
 * A cache of freehand location string -> normalized location
 * - id: The freehand location string
 * - pKey: The first character of the freehand location string
 */
export interface LocationCache extends Location {
  id: string;
  pKey: string;
}

export interface Location {
  // Normalized from the rest of the fields
  location?: string;
  remote?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}
