import type { Location } from "../models/models.ts";
import { AppError } from "../utils/AppError.ts";
import { logCounter, logError } from "../utils/telemetry.ts";
import { db } from "./db.ts";
import { LRUCache } from "./lruCache.ts";

const locationMemoryCache = new LRUCache<string, Location>(1000);

export async function getCachedLocation(
  locationText: string,
): Promise<Location | undefined> {
  try {
    const key = normalize(locationText);
    const cachedResult = locationMemoryCache.get(key);

    if (cachedResult) {
      logCounter("GetCachedLocation_MemoryHit");
      return cachedResult;
    }

    const dbCachedResult = await db.locationCache.getItem(key, key[0]!);

    if (dbCachedResult) {
      logCounter("GetCachedLocation_DBHit");
      const { city, regionCode, countryCode } = dbCachedResult;
      const cleanedLocation = { city, regionCode, countryCode };
      locationMemoryCache.set(key, cleanedLocation);
      return cleanedLocation;
    }
  } catch (e) {
    logError(new AppError("GetCachedLocation", undefined, e));
  }

  return undefined;
}

export function setCachedLocation(locationText: string, location: Location) {
  try {
    const key = normalize(locationText);
    locationMemoryCache.set(key, location);

    // Don't await on cache insertion
    void db.locationCache.upsertItem({
      id: key,
      pKey: key[0]!,
      ...location,
    });
  } catch (e) {
    logError(new AppError("SetCachedLocation", undefined, e));
  }
}

function normalize(key: string) {
  return (
    key
      .toLowerCase()
      .trim()
      // ['/', '\\', '#'] cannot be used in CosmosDB keys (ie. for the DB cache)
      .replace(/[/\\#]/g, "_")
  );
}
