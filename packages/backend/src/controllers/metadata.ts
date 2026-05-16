import { db } from "../db/db.ts";
import type { ClientMetadata } from "../models/clientModels.ts";
import type { CompanyQuickRef } from "../models/models.ts";
import { debounceAsync, debouncePromise } from "../utils/debounceUtils.ts";
import { logProperty } from "../utils/telemetry.ts";

const getCompanyMetadata = () => db.metadata.getItem("company", "company");
const getJobMetadata = () => db.metadata.getItem("job", "job");
const cacheCompanyMeta = debouncePromise(getCompanyMetadata);
const cacheJobMeta = debouncePromise(getJobMetadata);

const cacheQuickRefMap = debouncePromise(getQuickRefMap);
const cachedClientMetadata = debouncePromise(getClientMetadata);

export function getMetadata(): Promise<ClientMetadata> {
  return cachedClientMetadata();
}

export async function getCompanyQuickRef(
  id: string,
): Promise<CompanyQuickRef | undefined> {
  const companyMap = await cacheQuickRefMap();
  return companyMap.get(id);
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
    db.metadata.upsertItem(jobMetadata),
    db.metadata.upsertItem({
      id: "company",
      companyCount: validRefs.length,
      companyQuickRef: validRefs,
    }),
  ]);

  logProperty("Metadata", {
    jobCount: jobMetadata.jobCount,
    companyCount: validRefs.length,
  });

  cacheCompanyMeta.clear();
  cacheQuickRefMap.clear();
  cacheJobMeta.clear();
  cachedClientMetadata.clear();
}

async function getQuickRefMap(): Promise<Map<string, CompanyQuickRef>> {
  const metadata = await cacheCompanyMeta();
  const refs = metadata?.companyQuickRef ?? [];
  return new Map(refs.map((x) => [x[0], x] as [string, CompanyQuickRef]));
}

async function getClientMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, jobMetadata] = await Promise.all([
    cacheCompanyMeta(),
    cacheJobMeta(),
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
    workTimeCounts = {},
    stageCounts = {},
    topLocations = [],
    salaryStats = [],
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
    workTimeCounts,
    stageCounts,
    topLocations,
    salaryStats,
  };

  return metadata;
}
