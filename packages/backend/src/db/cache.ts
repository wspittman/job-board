import { logCounter, logError } from "../telemetry/telemetry.ts";
import { AppError } from "../utils/AppError.ts";
import { db } from "./db.ts";
import { LRUCache } from "./lruCache.ts";
import { normalizeId } from "./utils.ts";

const locationMemoryCache = new LRUCache<string, string>(1000);

export async function getCachedLocation(
  locationText: string,
): Promise<string | undefined> {
  try {
    const key = normalizeId(locationText);
    if (!key) return undefined;
    const cachedResult = locationMemoryCache.get(key);

    if (cachedResult) {
      logCounter("GetCachedLocation_MemoryHit");
      return cachedResult;
    }

    const dbCachedResult = await db.locationCache.getItem(key, key[0]!);

    if (dbCachedResult) {
      logCounter("GetCachedLocation_DBHit");
      const { city } = dbCachedResult;
      if (city) {
        locationMemoryCache.set(key, city);
        return city;
      }
    }
  } catch (e) {
    logError(new AppError("GetCachedLocation", undefined, e));
  }

  return undefined;
}

export function setCachedLocation(locationText: string, city: string) {
  try {
    const key = normalizeId(locationText);
    if (!key) return;
    locationMemoryCache.set(key, city);

    // Don't await on cache insertion
    void db.locationCache.upsertItem({
      id: key,
      pKey: key[0]!,
      city,
    });
  } catch (e) {
    logError(new AppError("SetCachedLocation", undefined, e));
  }
}
