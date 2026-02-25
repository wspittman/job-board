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

export const refreshCompanyMetadata = debounceAsync(
  "RefreshMetadata",
  refreshCompanyInternal,
);

export const refreshJobMetadata = debounceAsync(
  "RefreshMetadata",
  refreshJobInternal,
);

async function refreshCompanyInternal() {
  const refs = await db.company.query<{
    id: string;
    name: string;
    website?: string;
  }>("SELECT c.id, c.name, c.website FROM c");

  await db.metadata.upsertItem({
    id: "company",
    companyCount: refs.length,
    companyQuickRef: refs.map(({ id, name, website }) => [id, name, website]),
  });

  logProperty("Metadata", { companyCount: refs.length });

  cacheCompanyMeta.clear();
  cacheQuickRefMap.clear();
  cachedClientMetadata.clear();
}

async function refreshJobInternal() {
  const jobCount = await db.job.getCount();

  await db.metadata.upsertItem({
    id: "job",
    jobCount,
  });

  logProperty("Metadata", { jobCount });

  cacheJobMeta.clear();
  cachedClientMetadata.clear();
}

async function getQuickRefMap(): Promise<Map<string, CompanyQuickRef>> {
  const metadata = await cacheCompanyMeta();
  const refs = metadata?.companyQuickRef ?? [];
  const f = new Map(refs.map((x) => [x[0], x] as [string, CompanyQuickRef]));
  console.dir(f, { depth: null });
  return f;
}

async function getClientMetadata(): Promise<ClientMetadata> {
  const [companyMetadata, jobMetadata] = await Promise.all([
    cacheCompanyMeta(),
    cacheJobMeta(),
  ]);

  const companyQuickRef = companyMetadata?.companyQuickRef ?? [];
  const companyNames = companyQuickRef.map(
    ([id, name]) => [id, name] as [string, string],
  );

  const metadata: ClientMetadata = {
    companyCount: companyMetadata?.companyCount ?? 0,
    companyNames,
    jobCount: jobMetadata?.jobCount ?? 0,
    // _ts is in seconds, but the client expects milliseconds
    timestamp:
      Math.max(companyMetadata?._ts ?? 0, jobMetadata?._ts ?? 0) * 1000,
  };

  return metadata;
}
