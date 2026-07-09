import { db } from "../db/db.ts";
import type { ClientMetadata } from "../models/clientModels.ts";
import { logProperty } from "../telemetry/telemetry.ts";
import { debounceAsync, debouncePromise } from "../utils/debounceUtils.ts";

const cachedClientMetadata = debouncePromise(getClientMetadata);

export function getMetadata(): Promise<ClientMetadata> {
  return cachedClientMetadata();
}

export const refreshMetadata = debounceAsync(
  "RefreshMetadata",
  refreshInternal,
);

async function refreshInternal() {
  const [quickRefs, companyIds, jobMetadata] = await Promise.all([
    db.company.getQuickRefs(),
    db.job.getCompanyIds(),
    db.job.aggregateMetadata(),
  ]);

  // Only include quick refs for companies that have jobs
  const companyIdSet = new Set(companyIds);
  const validRefs = quickRefs.filter(([id]) => companyIdSet.has(id));

  const emptyIds = quickRefs.filter(([id]) => !companyIdSet.has(id));
  if (emptyIds.length) {
    logProperty(
      "EmptyCompanies",
      emptyIds.map(([id]) => id),
    );
  }

  await Promise.all([
    db.metadata.upsert(jobMetadata),
    db.metadata.upsert({
      id: "company",
      companyCount: validRefs.length,
      companyQuickRef: validRefs,
    }),
  ]);

  logProperty("Metadata", {
    jobCount: jobMetadata.jobCount,
    companyCount: validRefs.length,
  });

  cachedClientMetadata.clear();
}

async function getClientMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, jobMetadata] = await Promise.all([
    db.metadata.getCompany(),
    db.metadata.getJob(),
  ]);
  const {
    companyCount = 0,
    companyQuickRef = [],
    _ts: companyTS = 0,
  } = companyMetadata ?? {};
  const {
    jobCount = 0,
    recentJobCount = 0,
    presenceCounts = {},
    jobFamilyCounts = {},
    _ts: jobTS = 0,
  } = jobMetadata ?? {};

  const companyNames = companyQuickRef.map(
    ([id, name]) => [id, name] as [string, string],
  );

  const metadata: ClientMetadata = {
    // _ts is in seconds, but the client expects milliseconds
    timestamp: Math.max(companyTS, jobTS) * 1000,
    companyCount,
    companyNames,
    jobCount,
    recentJobCount,
    presenceCounts,
    jobFamilyCounts,
  };

  return metadata;
}
