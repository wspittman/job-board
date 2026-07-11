import { ats } from "../ats/ats.ts";
import { db } from "../db/db.ts";
import type { CompanyKey, Job } from "../models/models.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import type { Context } from "../types/types.ts";
import type { OnGroupEnd } from "../utils/asyncQueue.ts";
import { JOB_EXPIRY_MS } from "../utils/constants.ts";
import { jobInfoQueue } from "./refreshJobInfo.ts";

/**
 * Refreshes jobs for a specific company by synchronizing with ATS
 * @param key Company identifier and optional timestamp to replace older jobs
 * @returns Promise resolving when jobs are refreshed
 */
export async function refreshJobsForCompany(
  key: CompanyKey & { replaceJobsOlderThan?: number },
) {
  logProperty("Input", key);
  const companyId = key.id;

  // If the company is in the quick ref map, then it has jobs in the DB
  const exists = (await db.metadata.getCompanyQuickRef(companyId)) != null;

  if (exists) {
    logProperty("Company_HasDBJobs", true);
    // We should always jobs that show as expired in the DB, regardless of ETag state
    // Jobs that have been updated in the ATS (and given and updated, unexpired post time) will be reprocessed as if new
    await removeExpiredJobs(companyId);
  }

  // Get the saved etag, unless we are doing forced reprocessing
  const etagId = `RefreshJobsForCompany_${exists ? "exists" : "absent"}`;
  const etag =
    key.replaceJobsOlderThan == null ? await getETag(etagId, key) : undefined;

  // Use the ETag caching flow
  // Ask for meta if the company exists. Otherwise assume newly added company and get full job data for all jobs.
  const atsTags = await ats.getJobsETag(key, etag, exists);

  if (atsTags.stable) {
    logProperty("ATS_Jobs_Stable", true);
    return;
  }

  const { data: atsJobs, etag: newEtag } = atsTags;
  logProperty("ATS_Jobs_All", atsJobs.length);

  const [currentIds, ignoreIds] = await Promise.all([
    getJobIds(companyId, key.replaceJobsOlderThan),
    db.ignoreJob.getIds(key),
  ]);

  const [add, remove] = await groupAtsJobs(key, atsJobs, currentIds, ignoreIds);
  const onJobsProcessed = createETagCallback(etagId, key, newEtag);

  if (remove.length) {
    await db.job.removeMany(remove, companyId);
  }

  if (add.length) {
    const company = await db.company.get(key);

    if (!company) {
      // Unexpected but could happen if the company was deleted after we fetched the keys but before we refreshed the jobs.
      logProperty("CompanyNotFound", companyId);
      return;
    }

    const { stage, size } = company;

    add.forEach(({ item }) => {
      if (stage) item.companyStage = stage;
      if (size) item.companySize = size;
    });

    jobInfoQueue.add(
      add.map((job) => [key, job]),
      onJobsProcessed,
    );
  } else {
    await onJobsProcessed?.(false);
  }
}

async function removeExpiredJobs(companyId: string) {
  const expiryWindow = Date.now() - JOB_EXPIRY_MS;
  const expiredIds = await db.job.getExpiredIds(companyId, expiryWindow);

  if (expiredIds.length) {
    logProperty("DB_Jobs_Expired", expiredIds.length);
    await db.job.removeMany(expiredIds, companyId);
  }
}

async function getJobIds(companyId: string, cutoffMS?: number) {
  if (!cutoffMS) {
    return await db.job.getIds(companyId);
  }

  // CosmosDB uses seconds, not milliseconds
  const cutoff = cutoffMS / 1000;
  const pairs = await db.job.getIdsAndTimestamps(companyId);
  // Pretend we don't have jobs added before the cutoff
  return pairs.filter(({ _ts }) => _ts >= cutoff).map(({ id }) => id);
}

async function groupAtsJobs(
  key: CompanyKey,
  atsJobs: Context<Job>[],
  currentIds: string[],
  ignoreIds: string[] = [],
) {
  const idSet = (x: Context<Job>[]) => new Set(x.map(({ item: { id } }) => id));

  // Filter out any jobs that are beyond the expiry window to avoid processing stale listings
  const expiryWindow = Date.now() - JOB_EXPIRY_MS;
  const freshJobs = atsJobs.filter(
    ({ item: { postTS } }) => postTS >= expiryWindow,
  );
  logProperty("ATS_Jobs_Stale", atsJobs.length - freshJobs.length);

  // Filter out jobs that are in the ignore set
  const ignoreIdSet = new Set(ignoreIds);
  const validJobs = freshJobs.filter(
    ({ item: { id } }) => !ignoreIdSet.has(id),
  );
  logProperty("ATS_Jobs_Ignored", freshJobs.length - validJobs.length);

  // Filter out jobs that are already saved
  const currentIdSet = new Set(currentIds);
  let newJobs = validJobs.filter(({ item: { id } }) => !currentIdSet.has(id));
  logProperty("ATS_Jobs_Known", validJobs.length - newJobs.length);

  // Any jobs in the current set but not in valid group need to be removed
  const validJobIdSet = idSet(validJobs);
  const removeJobs = currentIds.filter((id) => !validJobIdSet.has(id));

  // Get the full job data for all jobs if
  // - There is more than 1 added job
  // - More than 10% of jobs are new
  // - We don't already have full job data
  // Better to do one big API call with unnecessary data than many small API calls
  if (
    newJobs.length > 1 &&
    newJobs.length > 0.1 * atsJobs.length &&
    !atsJobs[0]?.context
  ) {
    const atsJobsFull = await ats.getJobs(key, false);
    const newIdSet = idSet(newJobs);
    newJobs = atsJobsFull.filter(({ item: { id } }) => newIdSet.has(id));
  }

  logProperty("ATS_Jobs_ToAdd", newJobs.length);
  logProperty("ATS_Jobs_ToRemove", removeJobs.length);

  return [newJobs, removeJobs] as const;
}

async function getETag(
  id: string,
  key: CompanyKey,
): Promise<string | undefined> {
  if (!ats.supportsETag(key)) return undefined;
  return db.eTag.get(id, key);
}

function createETagCallback(
  id: string,
  key: CompanyKey,
  etag?: string,
): OnGroupEnd | undefined {
  if (!ats.supportsETag(key) || !etag) return undefined;
  return async (hasFailure: boolean) => {
    if (!hasFailure) {
      // Set etag only when and if all job tasks have finished successfully
      await db.eTag.set(id, key, etag);
    }
  };
}
